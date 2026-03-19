export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { messages, sectionId } = req.body;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    // بنربط الـ IDs اللي معاك بالأجزاء بتاعتها
    const promptIDs = {
        'A': '',
        'B': 'pmpt_69ba4187a4b8819487e5149c6dd9c1de07f19f90b79f8a57',
        'C': 'pmpt_69ba4187a4b8819487e5149c6dd9c1de07f19f90b79f8a57',
        'D': 'pmpt_69ba41d050748196b4ce39726f55e49601b77901549f4b6c'
    };

    // لو sectionId مش موجود في اللي فوق (يعني سؤال Q1 مثلاً)، هيديله Prompt عام
    const systemPrompt = promptIDs[sectionId] || "أنت مدرس رياضيات مصري شاطر، ساعد الطالب في حل مسألة التفاضل الجزئي دي خطوة بخطوة بالعامية المصرية واستخدم LaTeX.";

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages
                ]
            })
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'حصل خطأ في السيرفر' });
    }
}
