import os
import concurrent.futures
from typing import Dict, Any, List
from openai import OpenAI
from groq import Groq
import google.generativeai as genai

from .prompts import ANALYST_PROMPT, CONTRARIAN_PROMPT, EDUCATOR_PROMPT, FINAL_VERDICT_PROMPT

class LLMOrchestrator:
    def __init__(self):
        # Initialize clients with environment variables
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.groq_key = os.getenv("GROQ_API_KEY")
        # Support both names for Gemini
        self.gemini_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        
        # Debugging (Masked)
        import os as sys_os
        print(f"[PID {sys_os.getpid()}] LLM Client Init - OpenAI={'OK' if self.openai_key else 'MISSING'}, Groq={'OK' if self.groq_key else 'MISSING'}, Gemini={'OK' if self.gemini_key else 'MISSING'}")
        
        self.openai_client = OpenAI(api_key=self.openai_key) if self.openai_key else None
        self.groq_client = Groq(api_key=self.groq_key) if self.groq_key else None
        
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.gemini_model = None

    def get_analyst_view(self, stock_context: Dict[str, Any]) -> str:
        """
        OpenAI-powered professional analyst perspective.
        """
        if not self.openai_client: return "Analytical engine is currently warming up. Please check back in a moment."
        
        prompt = ANALYST_PROMPT.format(
            symbol=stock_context['symbol'],
            profile=stock_context['profile'],
            ratios=stock_context['ratios'],
            f_score=stock_context['ratios']['quality_scores']['piotroski_f_score'],
            z_score=stock_context['ratios']['quality_scores']['altman_z_score'],
            benchmarks=stock_context['benchmarks']['averages'],
            stance=stock_context['stance']['overall_stance']
        )
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}]
            )
            return self._apply_compliance_filter(response.choices[0].message.content)
        except Exception as e:
            return "Professional analysis is briefly unavailable. Focusing on raw data metrics for now."

    def get_contrarian_view(self, stock_context: Dict[str, Any]) -> str:
        """
        Groq-powered contrarian perspective focused on risks.
        """
        if not self.groq_client: return "Risk assessment engine is currently unavailable."
        
        prompt = CONTRARIAN_PROMPT.format(
            symbol=stock_context['symbol'],
            profile=stock_context['profile'],
            ratios=stock_context['ratios'],
            benchmarks=stock_context['benchmarks']['averages']
        )
        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}]
            )
            return self._apply_compliance_filter(response.choices[0].message.content)
        except Exception as e:
            return "Contrarian risk perspective is currently unavailable."

    def get_educator_view(self, stock_context: Dict[str, Any]) -> str:
        """
        Gemini-powered educational perspective.
        """
        if not self.gemini_model: return "Educational explanations are currently unavailable."
        
        prompt = EDUCATOR_PROMPT.format(
            symbol=stock_context['symbol'],
            ratios=stock_context['ratios'],
            stance=stock_context['stance']['overall_stance']
        )
        try:
            response = self.gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            return "Educational context is briefly unavailable."

    def generate_final_verdict(self, stock_context: Dict[str, Any], perspectives: Dict[str, str]) -> str:
        """
        Generates a balanced synthesis using Gemini.
        """
        if not self.gemini_model: return "The consensus engine is preparing a balanced view. Please review individual perspectives below."
        
        prompt = FINAL_VERDICT_PROMPT.format(
            symbol=stock_context['symbol'],
            analyst_view=perspectives.get('analyst'),
            contrarian_view=perspectives.get('contrarian'),
            stance=stock_context['stance']['overall_stance']
        )
        try:
            response = self.gemini_model.generate_content(prompt)
            return self._apply_compliance_filter(response.text)
        except Exception as e:
            return f"Strategic synthesis for {stock_context['symbol']} is pending. Please rely on the individual analyst views for now."

    def generate_all_perspectives(self, stock_context: Dict[str, Any]) -> Dict[str, str]:
        """
        Generates all perspectives in parallel and adds synthesis.
        """
        with concurrent.futures.ThreadPoolExecutor() as executor:
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
        Heuristic filter to remove advice-oriented keywords.
        """
        forbidden = ["BUY", "SELL", "HOLD", "INVEST", "ACCUMULATE", "TOWARDS", "REACH", "TARGET"]
        cleaned = text
        for word in forbidden:
            # Case insensitive replace with [REDACTED] or simply remove
            import re
            cleaned = re.sub(rf'\b{word}\b', "[COMPLIANCE_REMOVED]", cleaned, flags=re.IGNORECASE)
        
        # Add compliance footer if needed or just return cleaned text
        return cleaned
