import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

BRAND_NAME = "Trendova Hub"
PAGE_WIDTH, PAGE_HEIGHT = A4
SIDE_MARGIN = 20 * mm
TOP_MARGIN = 25 * mm
BOTTOM_MARGIN = 20 * mm

# Colour palette
NAVY = colors.HexColor("#0B1220")
DARK_SLATE = colors.HexColor("#1E293B")
INDIGO = colors.HexColor("#4F46E5")
LIGHT_INDIGO = colors.HexColor("#E0E7FF")
EMERALD = colors.HexColor("#059669")
LIGHT_EMERALD = colors.HexColor("#D1FAE5")
AMBER = colors.HexColor("#D97706")
LIGHT_AMBER = colors.HexColor("#FEF3C7")
ROSE = colors.HexColor("#E11D48")
LIGHT_ROSE = colors.HexColor("#FFE4E6")
LIGHT_GREY = colors.HexColor("#F1F5F9")
MED_GREY = colors.HexColor("#94A3B8")
BORDER_GREY = colors.HexColor("#CBD5E1")


def _safe(val, fmt=None, suffix="", prefix=""):
    if val is None:
        return "N/A"
    if fmt:
        try:
            return f"{prefix}{fmt.format(val)}{suffix}"
        except (ValueError, TypeError):
            return "N/A"
    return f"{prefix}{val}{suffix}"


def _truncate(text, limit=2000):
    if not text:
        return ""
    text = str(text)
    if len(text) <= limit:
        return text
    return text[:limit] + "..."


class PDFReportBuilder:
    def __init__(self, data: dict):
        self.data = data
        self.symbol = data.get("symbol", "UNKNOWN")
        self.profile = data.get("profile") or {}
        self.price = data.get("price") or {}
        self.ratios = data.get("ratios") or {}
        self.stance = data.get("stance") or {}
        self.benchmarks = data.get("benchmarks") or {}
        self.ai_insights = data.get("ai_insights") or {}
        self.integrity = data.get("integrity_audit") or {}
        self.generated_at = datetime.now()
        self._build_styles()

    def _build_styles(self):
        base = getSampleStyleSheet()
        self.styles = {}

        self.styles["title"] = ParagraphStyle(
            "ReportTitle", parent=base["Title"],
            fontName="Helvetica-Bold", fontSize=28, leading=34,
            textColor=NAVY, spaceAfter=4,
        )
        self.styles["subtitle"] = ParagraphStyle(
            "ReportSubtitle", parent=base["Normal"],
            fontName="Helvetica", fontSize=14, leading=18,
            textColor=MED_GREY, spaceAfter=2,
        )
        self.styles["section"] = ParagraphStyle(
            "SectionHeading", parent=base["Heading2"],
            fontName="Helvetica-Bold", fontSize=15, leading=20,
            textColor=INDIGO, spaceBefore=18, spaceAfter=8,
            borderPadding=(0, 0, 2, 0),
        )
        self.styles["body"] = ParagraphStyle(
            "BodyText", parent=base["Normal"],
            fontName="Helvetica", fontSize=10, leading=14,
            textColor=NAVY, alignment=TA_JUSTIFY,
        )
        self.styles["body_small"] = ParagraphStyle(
            "BodySmall", parent=base["Normal"],
            fontName="Helvetica", fontSize=9, leading=12,
            textColor=DARK_SLATE,
        )
        self.styles["label"] = ParagraphStyle(
            "Label", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=10, leading=13,
            textColor=DARK_SLATE,
        )
        self.styles["value_big"] = ParagraphStyle(
            "ValueBig", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=20, leading=26,
            textColor=NAVY,
        )
        self.styles["quote"] = ParagraphStyle(
            "Quote", parent=base["Normal"],
            fontName="Helvetica-Oblique", fontSize=10, leading=14,
            textColor=DARK_SLATE, leftIndent=12, rightIndent=12,
            borderPadding=(8, 8, 8, 8), alignment=TA_JUSTIFY,
        )
        self.styles["disclaimer"] = ParagraphStyle(
            "Disclaimer", parent=base["Normal"],
            fontName="Helvetica", fontSize=7, leading=10,
            textColor=MED_GREY, alignment=TA_JUSTIFY,
        )
        self.styles["bullet"] = ParagraphStyle(
            "Bullet", parent=base["Normal"],
            fontName="Helvetica", fontSize=10, leading=14,
            textColor=DARK_SLATE, leftIndent=16,
            bulletFontName="Helvetica", bulletFontSize=10,
            bulletIndent=4,
        )
        self.styles["table_header"] = ParagraphStyle(
            "TableHeader", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=9, leading=12,
            textColor=colors.white,
        )
        self.styles["table_cell"] = ParagraphStyle(
            "TableCell", parent=base["Normal"],
            fontName="Helvetica", fontSize=9, leading=12,
            textColor=NAVY,
        )
        self.styles["table_cell_bold"] = ParagraphStyle(
            "TableCellBold", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=9, leading=12,
            textColor=NAVY,
        )
        self.styles["ai_label"] = ParagraphStyle(
            "AILabel", parent=base["Normal"],
            fontName="Helvetica-Bold", fontSize=12, leading=16,
            textColor=INDIGO, spaceBefore=12, spaceAfter=4,
        )
        self.styles["center"] = ParagraphStyle(
            "Centered", parent=base["Normal"],
            fontName="Helvetica", fontSize=10, leading=14,
            textColor=MED_GREY, alignment=TA_CENTER,
        )

    def _header_footer(self, canvas, doc):
        canvas.saveState()
        # Header line
        canvas.setStrokeColor(INDIGO)
        canvas.setLineWidth(1.5)
        canvas.line(SIDE_MARGIN, PAGE_HEIGHT - 18 * mm,
                    PAGE_WIDTH - SIDE_MARGIN, PAGE_HEIGHT - 18 * mm)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColor(INDIGO)
        canvas.drawString(SIDE_MARGIN, PAGE_HEIGHT - 16 * mm, BRAND_NAME)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MED_GREY)
        title = f"{self.symbol} Stock Analysis Report"
        canvas.drawRightString(PAGE_WIDTH - SIDE_MARGIN, PAGE_HEIGHT - 16 * mm, title)

        # Footer
        canvas.setStrokeColor(BORDER_GREY)
        canvas.setLineWidth(0.5)
        canvas.line(SIDE_MARGIN, BOTTOM_MARGIN - 6 * mm,
                    PAGE_WIDTH - SIDE_MARGIN, BOTTOM_MARGIN - 6 * mm)
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(MED_GREY)
        canvas.drawString(SIDE_MARGIN, BOTTOM_MARGIN - 10 * mm,
                          f"Generated: {self.generated_at.strftime('%d %b %Y, %I:%M %p')}")
        canvas.drawRightString(PAGE_WIDTH - SIDE_MARGIN, BOTTOM_MARGIN - 10 * mm,
                               f"Page {doc.page}")
        canvas.restoreState()

    def _make_table(self, headers, rows, col_widths=None):
        content_width = PAGE_WIDTH - 2 * SIDE_MARGIN
        header_cells = [Paragraph(h, self.styles["table_header"]) for h in headers]
        table_data = [header_cells]
        for row in rows:
            table_data.append([
                Paragraph(str(c), self.styles["table_cell"]) for c in row
            ])

        if col_widths is None:
            n = len(headers)
            col_widths = [content_width / n] * n

        t = Table(table_data, colWidths=col_widths, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("TOPPADDING", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 1), (-1, -1), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREY]),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER_GREY),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 1), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ]))
        return t

    def _section_heading(self, text):
        return Paragraph(text, self.styles["section"])

    def _hr(self):
        return HRFlowable(width="100%", thickness=0.5, color=BORDER_GREY,
                          spaceBefore=4, spaceAfter=8)

    # ─── Section builders ───

    def _build_header(self):
        elements = []
        elements.append(Paragraph(self.symbol, self.styles["title"]))
        name = self.profile.get("name", "")
        if name:
            elements.append(Paragraph(name, self.styles["subtitle"]))

        tags = []
        if self.profile.get("sector"):
            tags.append(self.profile["sector"])
        if self.profile.get("industry"):
            tags.append(self.profile["industry"])
        if tags:
            elements.append(Paragraph(" | ".join(tags), self.styles["body_small"]))

        elements.append(Spacer(1, 6))

        price_str = _safe(self.price.get("current"), "{:,.2f}", prefix="Rs ")
        date_str = _safe(self.price.get("date"))
        stance_str = self.stance.get("overall_stance", "N/A")
        score_str = _safe(self.stance.get("overall_score"), "{}/10")

        info_line = f"<b>Price:</b> {price_str} ({date_str})&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;<b>Stance:</b> {stance_str}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;<b>Score:</b> {score_str}"
        elements.append(Paragraph(info_line, self.styles["body"]))
        elements.append(self._hr())
        return elements

    def _build_overview(self):
        desc = self.profile.get("description")
        if not desc:
            return []
        elements = []
        elements.append(self._section_heading("Company Overview"))
        elements.append(Paragraph(desc, self.styles["body"]))
        elements.append(Spacer(1, 6))
        return elements

    def _build_key_metrics(self):
        profitability = self.ratios.get("profitability", {})
        leverage = self.ratios.get("leverage", {})
        valuation = self.ratios.get("valuation", {})
        quality = self.ratios.get("quality_scores", {})
        avgs = self.benchmarks.get("averages", {})

        rows = [
            ["ROE", _safe(profitability.get("roe"), "{:.1f}", "%"),
             _safe(avgs.get("avg_roe"), "{}", "%")],
            ["Net Margin", _safe(profitability.get("net_margin"), "{:.1f}", "%"),
             _safe(avgs.get("avg_net_margin"), "{}", "%")],
            ["Debt/Equity", _safe(leverage.get("debt_to_equity"), "{:.2f}"),
             _safe(avgs.get("avg_debt_equity"), "{}")],
            ["P/E Ratio", _safe(valuation.get("pe_ratio"), "{:.1f}"),
             _safe(avgs.get("avg_pe"), "{}")],
            ["F-Score", _safe(quality.get("piotroski_f_score"), "{}/9"),
             "6/9"],
            ["Z-Score", _safe(quality.get("altman_z_score"), "{:.2f}"),
             "3.0"],
        ]

        content_width = PAGE_WIDTH - 2 * SIDE_MARGIN
        elements = [
            self._section_heading("Key Metrics at a Glance"),
            self._make_table(
                ["Metric", "Value", "Sector Avg"],
                rows,
                col_widths=[content_width * 0.40, content_width * 0.30, content_width * 0.30],
            ),
            Spacer(1, 6),
        ]
        return elements

    def _build_fundamental_stance(self):
        elements = [self._section_heading("Fundamental Stance")]

        score_str = _safe(self.stance.get("overall_score"), "{}/10")
        stance_str = self.stance.get("overall_stance", "N/A")
        elements.append(Paragraph(
            f"<b>Overall:</b> {stance_str} ({score_str})", self.styles["body"]
        ))
        elements.append(Spacer(1, 4))

        pillars = self.stance.get("pillar_scores", {})
        pillar_rows = [
            ["Business Quality", _safe(pillars.get("business_quality"), "{}/10")],
            ["Financial Safety", _safe(pillars.get("financial_safety"), "{}/10")],
            ["Valuation Comfort", _safe(pillars.get("valuation_comfort"), "{}/10")],
        ]
        content_width = PAGE_WIDTH - 2 * SIDE_MARGIN
        elements.append(self._make_table(
            ["Pillar", "Score"],
            pillar_rows,
            col_widths=[content_width * 0.60, content_width * 0.40],
        ))
        elements.append(Spacer(1, 6))

        red_flags = self.stance.get("red_flags", [])
        if red_flags:
            elements.append(Paragraph("<b>Red Flags:</b>", self.styles["label"]))
            for flag in red_flags:
                elements.append(Paragraph(
                    f"\u2022 {flag}", self.styles["bullet"]
                ))
            elements.append(Spacer(1, 4))

        return elements

    def _build_detailed_financials(self):
        elements = [self._section_heading("Detailed Financial Analysis")]

        profitability = self.ratios.get("profitability", {})
        leverage = self.ratios.get("leverage", {})
        valuation = self.ratios.get("valuation", {})
        quality = self.ratios.get("quality_scores", {})
        growth = self.ratios.get("growth_trends", {})
        avgs = self.benchmarks.get("averages", {})
        comps = self.benchmarks.get("comparisons", {})

        def status_for(key):
            c = comps.get(key, {})
            return c.get("status", "N/A") if isinstance(c, dict) else "N/A"

        categories = [
            ("Growth", [
                ["Revenue CAGR (3Y)", _safe(growth.get("revenue_cagr_3y"), "{}", "%"), _safe(avgs.get("avg_net_margin"), "{}", "%"), "N/A"],
                ["Margin Stability", _safe(growth.get("margin_stability")), "Stable", "N/A"],
            ]),
            ("Profitability", [
                ["ROE", _safe(profitability.get("roe"), "{:.1f}", "%"), _safe(avgs.get("avg_roe"), "{}", "%"), status_for("roe")],
                ["ROA", _safe(profitability.get("roa"), "{:.1f}", "%"), "15%", "N/A"],
                ["Net Margin", _safe(profitability.get("net_margin"), "{:.1f}", "%"), _safe(avgs.get("avg_net_margin"), "{}", "%"), status_for("net_margin")],
            ]),
            ("Leverage", [
                ["Debt/Equity", _safe(leverage.get("debt_to_equity"), "{:.2f}"), _safe(avgs.get("avg_debt_equity"), "{}"), status_for("debt_to_equity")],
            ]),
            ("Valuation", [
                ["P/E Ratio", _safe(valuation.get("pe_ratio"), "{:.1f}"), _safe(avgs.get("avg_pe"), "{}"), status_for("pe")],
            ]),
            ("Quality Scores", [
                ["Piotroski F-Score", _safe(quality.get("piotroski_f_score"), "{}/9"), "6/9", "N/A"],
                ["Altman Z-Score", _safe(quality.get("altman_z_score"), "{:.2f}"), "3.0", "N/A"],
            ]),
        ]

        content_width = PAGE_WIDTH - 2 * SIDE_MARGIN
        for cat_name, rows in categories:
            elements.append(Paragraph(f"<b>{cat_name}</b>", self.styles["label"]))
            elements.append(Spacer(1, 2))
            elements.append(self._make_table(
                ["Metric", "Value", "Sector Avg", "Status"],
                rows,
                col_widths=[
                    content_width * 0.35,
                    content_width * 0.22,
                    content_width * 0.22,
                    content_width * 0.21,
                ],
            ))
            elements.append(Spacer(1, 8))

        return elements

    def _build_sector_benchmarks(self):
        elements = [self._section_heading("Sector Benchmark Comparison")]

        sector = self.benchmarks.get("sector", "Default")
        elements.append(Paragraph(f"Compared against <b>{sector}</b> sector averages.", self.styles["body_small"]))
        elements.append(Spacer(1, 4))

        avgs = self.benchmarks.get("averages", {})
        comps = self.benchmarks.get("comparisons", {})
        profitability = self.ratios.get("profitability", {})
        leverage = self.ratios.get("leverage", {})
        valuation = self.ratios.get("valuation", {})

        def diff_str(key):
            c = comps.get(key, {})
            if not isinstance(c, dict):
                return "N/A"
            diff = c.get("diff_pct")
            if diff is None:
                return "N/A"
            sign = "+" if diff >= 0 else ""
            return f"{sign}{diff}%"

        rows = [
            ["ROE",
             _safe(profitability.get("roe"), "{:.1f}", "%"),
             _safe(avgs.get("avg_roe"), "{}", "%"),
             diff_str("roe")],
            ["P/E Ratio",
             _safe(valuation.get("pe_ratio"), "{:.1f}"),
             _safe(avgs.get("avg_pe"), "{}"),
             diff_str("pe")],
            ["Debt/Equity",
             _safe(leverage.get("debt_to_equity"), "{:.2f}"),
             _safe(avgs.get("avg_debt_equity"), "{}"),
             diff_str("debt_to_equity")],
            ["Net Margin",
             _safe(profitability.get("net_margin"), "{:.1f}", "%"),
             _safe(avgs.get("avg_net_margin"), "{}", "%"),
             diff_str("net_margin")],
        ]

        content_width = PAGE_WIDTH - 2 * SIDE_MARGIN
        elements.append(self._make_table(
            ["Metric", "Company", "Sector Avg", "Difference"],
            rows,
            col_widths=[
                content_width * 0.28,
                content_width * 0.24,
                content_width * 0.24,
                content_width * 0.24,
            ],
        ))
        elements.append(Spacer(1, 6))
        return elements

    def _build_ai_perspectives(self):
        elements = [PageBreak(), self._section_heading("AI-Powered Perspectives")]

        ai = self.ai_insights
        has_content = any(ai.get(k) for k in ("final_verdict", "analyst", "contrarian", "educator"))

        if not has_content:
            elements.append(Paragraph(
                "AI insights were not included in this report.",
                self.styles["center"],
            ))
            elements.append(Spacer(1, 8))
            return elements

        # Final Verdict box
        verdict = ai.get("final_verdict", "")
        if verdict:
            verdict_text = _truncate(verdict)
            verdict_table = Table(
                [[Paragraph(f"<b>Final Verdict:</b> {verdict_text}", self.styles["body"])]],
                colWidths=[PAGE_WIDTH - 2 * SIDE_MARGIN],
            )
            verdict_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_INDIGO),
                ("BOX", (0, 0), (-1, -1), 1, INDIGO),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]))
            elements.append(verdict_table)
            elements.append(Spacer(1, 12))

        perspectives = [
            ("Professional Analyst View", ai.get("analyst", "")),
            ("Contrarian Risk View", ai.get("contrarian", "")),
            ("Educational Perspective", ai.get("educator", "")),
        ]
        for title, text in perspectives:
            if text:
                elements.append(Paragraph(title, self.styles["ai_label"]))
                elements.append(Paragraph(
                    f'"{_truncate(text)}"', self.styles["quote"]
                ))
                elements.append(Spacer(1, 8))

        return elements

    def _build_integrity_audit(self):
        elements = [self._section_heading("Data Integrity Audit")]

        completeness = self.integrity.get("data_completeness") or {}
        confidence = completeness.get("confidence", "N/A")
        is_valid = self.integrity.get("is_valid", False)
        audit_status = "PASSED" if is_valid else "WARNING"

        rows = [
            ["Data Confidence", f"{confidence}%"if confidence != "N/A" else "N/A"],
            ["Audit Status", audit_status],
        ]
        content_width = PAGE_WIDTH - 2 * SIDE_MARGIN
        elements.append(self._make_table(
            ["Check", "Result"],
            rows,
            col_widths=[content_width * 0.50, content_width * 0.50],
        ))
        elements.append(Spacer(1, 4))

        warnings = self.integrity.get("warnings", [])
        if warnings:
            elements.append(Paragraph("<b>Warnings:</b>", self.styles["label"]))
            for w in warnings:
                elements.append(Paragraph(f"\u2022 {w}", self.styles["bullet"]))
            elements.append(Spacer(1, 4))

        return elements

    def _build_disclaimer(self):
        disclaimer_text = (
            "DISCLAIMER: This report is an educational analysis generated by Trendova Hub, "
            "not fixed investment advice. All information is provided for learning purposes only. "
            "We do not recommend buying, selling, or holding any securities. Past performance "
            "does not guarantee future results. Stock market investments are subject to market risks. "
            "Please consult a SEBI-registered investment advisor before making any investment decisions. "
            "Trendova Hub and its affiliates are not responsible for any financial losses. "
            f"Report generated on {self.generated_at.strftime('%d %b %Y at %I:%M %p')}."
        )
        return [
            Spacer(1, 20),
            self._hr(),
            Paragraph("Legal Disclosure &amp; Risk Disclaimer", self.styles["label"]),
            Spacer(1, 4),
            Paragraph(disclaimer_text, self.styles["disclaimer"]),
            Spacer(1, 8),
            Paragraph(
                f"\u00a9 {self.generated_at.year} {BRAND_NAME} | Assets Analysis Intelligence",
                self.styles["disclaimer"],
            ),
        ]

    def build(self) -> bytes:
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=A4,
            leftMargin=SIDE_MARGIN,
            rightMargin=SIDE_MARGIN,
            topMargin=TOP_MARGIN,
            bottomMargin=BOTTOM_MARGIN,
            title=f"{self.symbol} Analysis Report",
            author=BRAND_NAME,
        )

        story = []
        story.extend(self._build_header())
        story.extend(self._build_overview())
        story.extend(self._build_key_metrics())
        story.extend(self._build_fundamental_stance())
        story.extend(self._build_detailed_financials())
        story.extend(self._build_sector_benchmarks())
        story.extend(self._build_ai_perspectives())
        story.extend(self._build_integrity_audit())
        story.extend(self._build_disclaimer())

        doc.build(story, onFirstPage=self._header_footer, onLaterPages=self._header_footer)
        return buf.getvalue()
