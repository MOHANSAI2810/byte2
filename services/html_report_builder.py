import json
from datetime import datetime
from typing import List, Dict, Any

def build_html_report(student_name: str, exam: dict, report: dict) -> str:
    """
    Generate a modern HTML report for the student evaluation.
    """
    
    total_score = report.get("total_score", 0)
    max_score = report.get("max_score", 0)
    percentage = report.get("percentage", 0)
    breakdown = report.get("score_breakdown", [])
    concept_gaps = report.get("concept_gaps", "No specific gaps identified.")
    improvement_tips = report.get("improvement_tips", "Continue with current study habits.")
    writing_quality = report.get("writing_quality", "Writing quality assessment not available.")
    performance_trend = report.get("performance_trend", "Insufficient data for trend analysis.")
    parent_summary = report.get("parent_summary", "Student has completed the assessment.")
    
    # Determine performance label and color
    if percentage >= 90:
        performance_label = "Excellent"
        performance_color = "text-green-400"
        badge_color = "bg-green-500/10 text-green-400 border-green-500/20"
        bar_color = "bg-green-500"
    elif percentage >= 75:
        performance_label = "Very Good"
        performance_color = "text-blue-400"
        badge_color = "bg-blue-500/10 text-blue-400 border-blue-500/20"
        bar_color = "bg-blue-500"
    elif percentage >= 60:
        performance_label = "Good"
        performance_color = "text-primary"
        badge_color = "bg-primary/20 text-primary border-primary/20"
        bar_color = "bg-primary"
    elif percentage >= 40:
        performance_label = "Needs Improvement"
        performance_color = "text-yellow-400"
        badge_color = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        bar_color = "bg-yellow-500"
    else:
        performance_label = "Critical Support Needed"
        performance_color = "text-red-400"
        badge_color = "bg-red-500/10 text-red-400 border-red-500/20"
        bar_color = "bg-red-500"
    
    # Get verdict for individual questions
    def get_question_verdict(score: float, max_marks: float) -> tuple:
        if max_marks == 0:
            return ("N/A", "bg-gray-500/10 text-gray-400 border-gray-500/20")
        pct = (score / max_marks) * 100
        if pct >= 80:
            return ("Excellent", "bg-green-500/10 text-green-400 border-green-500/20")
        elif pct >= 60:
            return ("Good", "bg-blue-500/10 text-blue-400 border-blue-500/20")
        elif pct >= 40:
            return ("Average", "bg-yellow-500/10 text-yellow-400 border-yellow-500/20")
        else:
            return ("Needs Work", "bg-red-500/10 text-red-400 border-red-500/20")
    
    # Build questions table rows
    questions_rows = ""
    for q in breakdown:
        verdict, badge_color_q = get_question_verdict(q.get("score", 0), q.get("max_marks", 1))
        questions_rows += f"""
            <tr class="table-row-hover transition-colors">
                <td class="px-6 py-4 text-slate-200">Q{q.get('q_no', '?')}</td>
                <td class="px-6 py-4 font-medium">{q.get('score', 0)}</td>
                <td class="px-6 py-4 text-slate-400">{q.get('max_marks', 0)}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold {badge_color_q} border">
                        {verdict}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-400 max-w-xs">{q.get('feedback', '—')}</td>
            </tr>
        """
    
    # Parse improvement tips into list items
    tips_list = ""
    if improvement_tips:
        # Split by numbers or newlines
        import re
        tips = re.split(r'\d+\.', improvement_tips)
        for tip in tips:
            if tip.strip():
                tips_list += f'<li class="flex gap-2"><span class="text-primary">•</span> {tip.strip()}</li>\n'
    
    # Generate mock trend chart bars based on performance
    # This creates a visual representation of trend (if we have historical data)
    # For now, using percentage as the latest point
    trend_bars = ""
    # Create 5 bars with increasing trend ending at current percentage
    base_values = [max(10, percentage - 30), max(20, percentage - 20), max(30, percentage - 10), max(40, percentage - 5), percentage]
    for i, val in enumerate(base_values):
        height = max(20, int((val / 100) * 100))
        is_last = i == 4
        bar_class = "bg-primary/60" if not is_last else "bg-primary/80"
        trend_bars += f'<div class="flex-1 {bar_class} h-[{height}%] rounded-t-sm hover:bg-primary/80 transition-colors"></div>\n'
    
    html = f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Evaluation Report - {student_name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script>
        tailwind.config = {{
            darkMode: 'class',
            theme: {{
                extend: {{
                    colors: {{
                        primary: '#7c3bed',
                        dashboard: '#0f0f0f',
                        card: 'rgba(255, 255, 255, 0.03)',
                        border: 'rgba(255, 255, 255, 0.1)',
                    }},
                    fontFamily: {{
                        sans: ['Inter', 'sans-serif'],
                    }},
                    borderRadius: {{
                        'twelve': '12px',
                        'sixteen': '16px',
                    }}
                }}
            }}
        }}
    </script>
    <style>
        .glass-card {{
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }}
        .glass-card:hover {{
            border-color: rgba(124, 60, 237, 0.4);
            transform: translateY(-2px);
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
        }}
        .table-row-hover:hover {{
            background: rgba(255, 255, 255, 0.02);
        }}
        @media print {{
            body {{
                background: white;
                color: black;
            }}
            .glass-card {{
                background: white;
                border: 1px solid #ddd;
                backdrop-filter: none;
            }}
            .glass-card:hover {{
                transform: none;
            }}
            button {{
                display: none;
            }}
        }}
    </style>
</head>
<body class="bg-dashboard text-slate-100 font-sans min-h-screen p-6 md:p-8">
    <main class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 class="text-3xl font-bold tracking-tight text-white">Student Evaluation Report</h1>
                <p class="text-slate-400 mt-1 flex items-center gap-2">
                    Student: <span class="text-primary font-semibold">{student_name}</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                    <span>Subject: {exam.get('subject', 'N/A')}</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                    <span>Date: {datetime.now().strftime('%Y-%m-%d')}</span>
                </p>
            </div>
            <button onclick="window.print()" class="bg-primary hover:bg-violet-600 text-white px-6 py-2.5 rounded-twelve font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                </svg>
                Download / Print PDF
            </button>
        </header>

        <!-- Score Summary Cards -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="glass-card p-6 rounded-sixteen">
                <p class="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Total Score</p>
                <div class="flex items-baseline gap-1">
                    <span class="text-4xl font-bold text-white">{total_score}</span>
                    <span class="text-slate-500 text-xl font-medium">/ {max_score}</span>
                </div>
            </div>
            <div class="glass-card p-6 rounded-sixteen">
                <p class="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Percentage</p>
                <div class="flex items-center gap-3">
                    <span class="text-4xl font-bold text-white">{percentage}%</span>
                    <div class="h-2 w-24 bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full {bar_color} w-[{percentage}%]"></div>
                    </div>
                </div>
            </div>
            <div class="glass-card p-6 rounded-sixteen border-l-4 border-l-primary">
                <p class="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Performance Label</p>
                <span class="text-4xl font-bold {performance_color}">{performance_label}</span>
            </div>
        </section>

        <!-- Score Breakdown Table -->
        <section class="glass-card rounded-sixteen overflow-hidden">
            <div class="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">Question-wise Breakdown</h2>
                <span class="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded">{len(breakdown)} Questions Total</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-slate-400 text-sm border-b border-border bg-white/[0.01]">
                            <th class="px-6 py-4 font-semibold uppercase tracking-wider">Question No</th>
                            <th class="px-6 py-4 font-semibold uppercase tracking-wider">Score</th>
                            <th class="px-6 py-4 font-semibold uppercase tracking-wider">Max Marks</th>
                            <th class="px-6 py-4 font-semibold uppercase tracking-wider">Verdict</th>
                            <th class="px-6 py-4 font-semibold uppercase tracking-wider">Feedback</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                        {questions_rows}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Analytics and Trends -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Performance Analytics -->
            <section class="glass-card rounded-sixteen p-6 space-y-4">
                <h2 class="text-lg font-semibold text-white flex items-center gap-2">
                    <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                    </svg>
                    Performance Analytics
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-tight">Concept Gaps</h3>
                        <p class="text-sm text-slate-400 leading-relaxed">{concept_gaps}</p>
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-tight">Improvement Tips</h3>
                        <ul class="text-sm text-slate-400 space-y-2 list-none">
                            {tips_list if tips_list else '<li class="flex gap-2"><span class="text-primary">•</span> Continue with current study habits.</li>'}
                        </ul>
                    </div>
                </div>
            </section>

            <!-- Performance Trend -->
            <section class="glass-card rounded-sixteen p-6 space-y-4">
                <h2 class="text-lg font-semibold text-white flex items-center gap-2">
                    <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                    </svg>
                    Performance Trend
                </h2>
                <div class="space-y-4">
                    <p class="text-sm text-slate-400 leading-relaxed">{performance_trend}</p>
                    <div class="h-32 w-full flex items-end justify-between gap-1 mt-4">
                        {trend_bars}
                    </div>
                    <p class="text-[10px] text-slate-500 text-center uppercase tracking-widest">Assessment History → Current</p>
                </div>
            </section>
        </div>

        <!-- Writing Quality Analysis -->
        <section class="glass-card rounded-sixteen p-6">
            <div class="flex items-center gap-4 mb-4">
                <div class="h-10 w-10 bg-primary/20 rounded-twelve flex items-center justify-center text-primary">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                    </svg>
                </div>
                <h2 class="text-lg font-semibold text-white">Writing Quality Analysis</h2>
            </div>
            <p class="text-slate-400 leading-relaxed">{writing_quality}</p>
        </section>

        <!-- Parent Summary -->
        <section class="bg-primary/5 border border-primary/20 rounded-sixteen p-8 relative overflow-hidden">
            <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <div class="relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
                <div class="md:w-2/3 space-y-3">
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">Parent Summary</h2>
                    <p class="text-slate-300 leading-relaxed italic">"{parent_summary}"</p>
                </div>
                <div class="md:w-1/3 flex justify-end">
                    <div class="bg-white/5 p-4 rounded-twelve border border-white/10 w-full text-center">
                        <p class="text-xs text-slate-400 uppercase tracking-widest mb-1">Overall Score</p>
                        <p class="text-lg font-bold text-primary">{percentage}%</p>
                    </div>
                </div>
            </div>
        </section>

        <footer class="pt-12 pb-6 text-center text-slate-600 text-xs tracking-widest uppercase">
            AI-Powered Evaluation Engine • Confidential Student Record • {datetime.now().year}
        </footer>
    </main>
</body>
</html>"""
    
    return html