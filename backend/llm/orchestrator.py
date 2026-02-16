import os
import re
import logging
import concurrent.futures
from typing import Dict, Any, List
from groq import Groq

from .prompts import ANALYST_PROMPT, CONTRARIAN_PROMPT, EDUCATOR_PROMPT, FINAL_VERDICT_PROMPT

logger = logging.getLogger(__name__)

# Standard disclaimer for AI-generated content
AI_DISCLAIMER = (
    "\n\n---\n"
    "**DISCLAIMER:** This AI-generated perspective is provided for educational purposes only "
    "and does not constitute investment advice, financial planning, or a recommendation to buy, "
    "sell, or hold any security. All analysis is based on historical data and publicly available "
    "information, which may be incomplete or subject to change. Past performance does not guarantee "
    "future results. Please consult a SEBI-registered financial advisor before making any investment decisions. "
    "The provider assumes no liability for financial losses resulting from reliance on this content."
)

class LLMOrchestrator:
    def __init__(self):
        # Initialize Groq client with environment variables
        self.groq_key = os.getenv("GROQ_API_KEY")

        print(f"[LLMOrchestrator] Initializing - API Key present: {bool(self.groq_key)}")
        logger.info(f"Initializing LLMOrchestrator - API Key present: {bool(self.groq_key)}")

        # Initialize Groq client safely
        try:
            if self.groq_key:
                self.groq_client = Groq(api_key=self.groq_key)
                # Using Llama 3.3 70B for best quality on free tier
                self.model_name = "llama-3.3-70b-versatile"
                print(f"[LLMOrchestrator] Groq client initialized successfully with model {self.model_name}")
                logger.info(f"Groq client initialized successfully with model {self.model_name}")
            else:
                print("[LLMOrchestrator] WARNING: No GROQ_API_KEY found in environment")
                logger.warning("No GROQ_API_KEY found in environment")
                self.groq_client = None
        except Exception as e:
            print(f"[LLMOrchestrator] ERROR: Failed to initialize Groq client: {e}")
            logger.error(f"Failed to initialize Groq client: {e}")
            self.groq_client = None

    def _extract_comprehensive_context(self, stock_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts and formats all available data from stock_context for comprehensive prompts.
        """
        profile = stock_context.get('profile', {})
        ratios = stock_context.get('ratios', {})
        stance = stock_context.get('stance', {})
        benchmarks = stock_context.get('benchmarks', {})
        price = stock_context.get('price', {})

        # Extract nested values safely
        profitability = ratios.get('profitability', {})
        leverage = ratios.get('leverage', {})
        valuation = ratios.get('valuation', {})
        quality_scores = ratios.get('quality_scores', {})
        growth_trends = ratios.get('growth_trends', {})

        pillar_scores = stance.get('pillar_scores', {})
        red_flags = stance.get('red_flags', [])

        averages = benchmarks.get('averages', {})
        comparisons = benchmarks.get('comparisons', {})

        # Helper to format comparison status
        def get_comparison(metric_key):
            comp = comparisons.get(metric_key, {})
            if isinstance(comp, dict):
                status = comp.get('status', 'inline')
                diff_pct = comp.get('diff_pct', 0)
                return status, diff_pct
            return 'inline', 0

        roe_status, roe_diff = get_comparison('roe')
        margin_status, margin_diff = get_comparison('net_margin')
        debt_status, debt_diff = get_comparison('debt_to_equity')
        pe_status, pe_diff = get_comparison('pe')

        # Format red flags
        red_flags_text = '\n'.join([f"- {flag}" for flag in red_flags]) if red_flags else "None identified"

        # Build comprehensive context dict
        return {
            'symbol': stock_context.get('symbol', 'N/A'),
            'company_name': profile.get('name', 'N/A'),
            'sector': profile.get('sector') or 'General',
            'description': profile.get('description', 'No description available'),
            'current_price': price.get('current') or 'N/A',
            'price_date': price.get('date', 'N/A'),

            # Profitability
            'roe': profitability.get('roe') or 'N/A',
            'roa': profitability.get('roa') or 'N/A',
            'net_margin': profitability.get('net_margin') or 'N/A',

            # Growth
            'revenue_cagr': growth_trends.get('revenue_cagr_3y') or 'N/A',
            'margin_stability': growth_trends.get('margin_stability', 'N/A'),

            # Leverage
            'debt_to_equity': leverage.get('debt_to_equity') or 'N/A',

            # Valuation
            'pe_ratio': valuation.get('pe_ratio') or 'N/A',

            # Quality
            'f_score': quality_scores.get('piotroski_f_score') or 'N/A',
            'z_score': quality_scores.get('altman_z_score') or 'N/A',

            # Sector benchmarks
            'avg_roe': averages.get('avg_roe') or 'N/A',
            'avg_net_margin': averages.get('avg_net_margin') or 'N/A',
            'avg_debt_equity': averages.get('avg_debt_equity') or 'N/A',
            'avg_pe': averages.get('avg_pe') or 'N/A',

            # Comparison statuses
            'roe_status': roe_status,
            'roe_diff': roe_diff,
            'margin_status': margin_status,
            'margin_diff': margin_diff,
            'debt_status': debt_status,
            'debt_diff': debt_diff,
            'pe_status': pe_status,
            'pe_diff': pe_diff,

            # Stance & pillars
            'stance': stance.get('overall_stance', 'N/A'),
            'overall_score': stance.get('overall_score') or 'N/A',
            'business_quality': pillar_scores.get('business_quality') or 'N/A',
            'financial_safety': pillar_scores.get('financial_safety') or 'N/A',
            'valuation_comfort': pillar_scores.get('valuation_comfort') or 'N/A',

            # Red flags
            'red_flags': red_flags_text,

            # Data integrity (if available in stock_context)
            'confidence': stock_context.get('integrity_audit', {}).get('data_completeness', {}).get('confidence', 'N/A'),
            'audit_status': 'PASSED' if stock_context.get('integrity_audit', {}).get('is_valid', False) else 'WARNING',
        }

    def get_analyst_view(self, stock_context: Dict[str, Any]) -> str:
        """
        Groq-powered professional analyst perspective.
        """
        if not self.groq_client: return "Analytical engine is currently warming up. Please check back in a moment."

        ctx = self._extract_comprehensive_context(stock_context)
        prompt = ANALYST_PROMPT.format(**ctx)

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500
            )
            content = self._apply_compliance_filter(response.choices[0].message.content)
            return content + AI_DISCLAIMER
        except Exception as e:
            logger.error(f"Groq (Analyst) error: {e}")
            return "Professional analysis is briefly unavailable. Focusing on raw data metrics for now."

    def get_contrarian_view(self, stock_context: Dict[str, Any]) -> str:
        """
        Groq-powered contrarian perspective focused on risks.
        """
        if not self.groq_client: return "Risk assessment engine is currently unavailable."

        ctx = self._extract_comprehensive_context(stock_context)
        prompt = CONTRARIAN_PROMPT.format(**ctx)

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500
            )
            content = self._apply_compliance_filter(response.choices[0].message.content)
            return content + AI_DISCLAIMER
        except Exception as e:
            logger.error(f"Groq (Contrarian) error: {e}")
            return "Contrarian risk perspective is currently unavailable."

    def get_educator_view(self, stock_context: Dict[str, Any]) -> str:
        """
        Groq-powered educational perspective.
        """
        if not self.groq_client: return "Educational explanations are currently unavailable."

        ctx = self._extract_comprehensive_context(stock_context)
        prompt = EDUCATOR_PROMPT.format(**ctx)

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500
            )
            # Educator view doesn't need compliance filter (already educational)
            return response.choices[0].message.content + AI_DISCLAIMER
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return "Educational context is briefly unavailable."

    def generate_final_verdict(self, stock_context: Dict[str, Any], perspectives: Dict[str, str]) -> str:
        """
        Generates a balanced synthesis using Groq.
        """
        if not self.groq_client:
            return "The consensus engine is preparing a balanced view. Please review individual perspectives below."

        ctx = self._extract_comprehensive_context(stock_context)
        # Add perspectives to context
        ctx['analyst_view'] = perspectives.get('analyst', 'N/A')
        ctx['contrarian_view'] = perspectives.get('contrarian', 'N/A')
        ctx['educator_view'] = perspectives.get('educator', 'N/A')

        prompt = FINAL_VERDICT_PROMPT.format(**ctx)

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            return self._apply_compliance_filter(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Final verdict generation error: {e}")
            return f"Strategic synthesis for {stock_context['symbol']} is pending. Please rely on the individual analyst views for now."

    def generate_all_perspectives(self, stock_context: Dict[str, Any]) -> Dict[str, str]:
        """
        Generates all perspectives in parallel and adds synthesis.
        """
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_analyst = executor.submit(self.get_analyst_view, stock_context)
            future_contrarian = executor.submit(self.get_contrarian_view, stock_context)
            future_educator = executor.submit(self.get_educator_view, stock_context)
            
            perspectives = {
                "analyst": future_analyst.result(),
                "contrarian": future_contrarian.result(),
                "educator": future_educator.result()
            }
            
            # Add final verdict after perspectives are ready
            perspectives["final_verdict"] = self.generate_final_verdict(stock_context, perspectives)
            
            return perspectives

    def _apply_compliance_filter(self, text: str) -> str:
        """
        Removes advice-oriented keywords to ensure compliance with regulatory standards.
        Returns text with flagged terms replaced.
        """
        forbidden_keywords = [
            r'\bbuy\b', r'\bsell\b', r'\bhold\b', r'\binvest\b',
            r'\baccumulate\b', r'\btarget\b', r'\brecommend\b',
            r'\bstrongly\s+buy\b', r'\bstrongly\s+sell\b'
        ]
        
        cleaned = text
        for pattern in forbidden_keywords:
            cleaned = re.sub(pattern, "[COMPLIANCE_FILTERED]", cleaned, flags=re.IGNORECASE)
        
        return cleaned
