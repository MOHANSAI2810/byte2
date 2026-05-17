import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# ── Color palette ──────────────────────────────────────────
PRIMARY  = colors.HexColor("#4F46E5")   # indigo
SUCCESS  = colors.HexColor("#10B981")   # green
WARNING  = colors.HexColor("#F59E0B")   # amber
DANGER   = colors.HexColor("#EF4444")   # red
LIGHT    = colors.HexColor("#F3F4F6")   # light gray
DARK     = colors.HexColor("#111827")   # near black
MUTED    = colors.HexColor("#6B7280")   # gray


def _grade_color(percentage: float):
    if percentage >= 80: return SUCCESS
    if percentage >= 60: return WARNING
    return DANGER


def _letter_grade(percentage: float) -> str:
    if percentage >= 90: return "A+"
    if percentage >= 80: return "A"
    if percentage >= 70: return "B+"
    if percentage >= 60: return "B"
    if percentage >= 50: return "C"
    return "D"


def build_pdf(student_name: str, exam: dict, report: dict) -> bytes:
    """
    Generate a professional A4 PDF report.
    Returns raw bytes — send directly as file download.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()

    # Custom styles
    def style(name, **kwargs):
        return ParagraphStyle(name, **kwargs)

    S = {
        "title":    style("t",  fontSize=24, textColor=PRIMARY,  fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=4),
        "subtitle": style("st", fontSize=11, textColor=MUTED,    fontName="Helvetica",      alignment=TA_CENTER, spaceAfter=20),
        "section":  style("sc", fontSize=13, textColor=PRIMARY,  fontName="Helvetica-Bold", spaceBefore=16, spaceAfter=6),
        "body":     style("b",  fontSize=10, textColor=DARK,     fontName="Helvetica",      leading=16, spaceAfter=6),
        "small":    style("sm", fontSize=9,  textColor=MUTED,    fontName="Helvetica"),
        "center":   style("c",  fontSize=10, textColor=DARK,     fontName="Helvetica",      alignment=TA_CENTER),
    }

    elems = []
    pct   = float(report.get("percentage", 0))
    gc    = _grade_color(pct)

    # ── Header ────────────────────────────────────────────
    elems.append(Paragraph("AI Paper Evaluator", S["title"]))
    elems.append(Paragraph("", S["subtitle"]))
    elems.append(HRFlowable(width="100%", thickness=2, color=PRIMARY))
    elems.append(Spacer(1, 0.4*cm))

    # ── Student + exam info ───────────────────────────────
    elems.append(Paragraph("Student & Exam Details", S["section"]))
    info = [
        ["Student Name", student_name,         "Subject",     exam.get("subject", "—")],
        ["Class",        exam.get("class", "—"), "Total Marks", str(exam.get("total_marks", "—"))],
        ["Exam",         exam.get("title", "—"), "Date",        report.get("created_at", "—")[:10]],
    ]
    info_tbl = Table(info, colWidths=[3.5*cm, 6*cm, 3.5*cm, 4*cm])
    info_tbl.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",  (2,0), (2,-1), "Helvetica-Bold"),
        ("FONTNAME",  (1,0), (-1,-1), "Helvetica"),
        ("FONTSIZE",  (0,0), (-1,-1), 10),
        ("TEXTCOLOR", (0,0), (0,-1), PRIMARY),
        ("TEXTCOLOR", (2,0), (2,-1), PRIMARY),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
    ]))
    elems.append(info_tbl)
    elems.append(Spacer(1, 0.3*cm))

    # ── Score summary box ─────────────────────────────────
    elems.append(Paragraph("Score Summary", S["section"]))
    score_data = [
        ["Total Score",    f"{report.get('total_score', 0)} / {report.get('max_score', 0)}"],
        ["Percentage",     f"{pct}%"],
        ["Grade",          _letter_grade(pct)],
    ]
    score_tbl = Table(score_data, colWidths=[5*cm, 5*cm])
    score_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), LIGHT),
        ("FONTNAME",      (0,0), (0,-1),  "Helvetica-Bold"),
        ("FONTNAME",      (1,0), (1,-1),  "Helvetica"),
        ("FONTSIZE",      (0,0), (-1,-1), 12),
        ("TEXTCOLOR",     (1,0), (1,-1),  gc),
        ("ALIGN",         (0,0), (-1,-1), "CENTER"),
        ("GRID",          (0,0), (-1,-1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("ROUNDEDCORNERS", [6]),
    ]))
    elems.append(score_tbl)
    elems.append(Spacer(1, 0.3*cm))

    # ── Per-question breakdown ────────────────────────────
    breakdown = report.get("score_breakdown", [])
    if breakdown:
        elems.append(Paragraph("Question-wise Score Breakdown", S["section"]))
        rows = [["Q.No", "Marks", "Max", "Feedback"]]
        for q in breakdown:
            rows.append([
                f"Q{q.get('q_no', '—')}",
                str(q.get("score", 0)),
                str(q.get("max_marks", 0)),
                q.get("feedback", "—")
            ])
        q_tbl = Table(rows, colWidths=[1.5*cm, 1.8*cm, 1.8*cm, 12.4*cm])
        q_tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,0),  PRIMARY),
            ("TEXTCOLOR",     (0,0), (-1,0),  colors.white),
            ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
            ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
            ("FONTSIZE",      (0,0), (-1,-1), 9),
            ("ALIGN",         (1,0), (2,-1),  "CENTER"),
            ("ROWBACKGROUNDS",(0,1), (-1,-1), [LIGHT, colors.white]),
            ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#E5E7EB")),
            ("TOPPADDING",    (0,0), (-1,-1), 6),
            ("BOTTOMPADDING", (0,0), (-1,-1), 6),
            ("VALIGN",        (0,0), (-1,-1), "TOP"),
            ("WORDWRAP",      (3,1), (3,-1),  True),
        ]))
        elems.append(q_tbl)

    # ── 6 analysis sections ───────────────────────────────
    sections = [
        ("Concept Gaps",       report.get("concept_gaps", "—")),
        ("Improvement Tips",   report.get("improvement_tips", "—")),
        ("Writing Quality",    report.get("writing_quality", "—")),
        ("Performance Trend",  report.get("performance_trend", "—")),
    ]
    for title, content in sections:
        elems.append(Paragraph(title, S["section"]))
        elems.append(Paragraph(str(content), S["body"]))

    # ── Parent summary (highlighted box) ─────────────────
    elems.append(HRFlowable(width="100%", thickness=1, color=SUCCESS))
    elems.append(Spacer(1, 0.2*cm))
    elems.append(Paragraph("Message for Parents", S["section"]))
    elems.append(Paragraph(str(report.get("parent_summary", "—")), S["body"]))

    # ── Footer ────────────────────────────────────────────
    elems.append(Spacer(1, 0.5*cm))
    elems.append(HRFlowable(width="100%", thickness=1, color=MUTED))
    elems.append(Paragraph(
        "Generated by AI Paper Evaluator — Powered by Claude AI",
        style("footer", fontSize=8, textColor=MUTED, alignment=TA_CENTER)
    ))

    doc.build(elems)
    buffer.seek(0)
    return buffer.read()
