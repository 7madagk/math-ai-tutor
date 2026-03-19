export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { messages, sectionId } = req.body;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    const promptIDs = {
        'A': {
            id: "pmpt_69ba413f411c8197b88a2a029d9d98440b1d2d9a7703c078",
            version: "12"
        },
        'B': '', // فاضي
        'C': '', // فاضي
        'D': ''  // فاضي
    };

    const selectedPrompt = promptIDs[sectionId];

    // --- الحتة اللي إنت عايزها من هنا ---
    // لو السيكشن مش موجود في القائمة فوق، أو موجود بس فاضي ('')
    if (!selectedPrompt || selectedPrompt === '') {
        return res.status(400).json({ 
            success: false, 
            error: "حصلت مشكلة: السيكشن ده ملوش برومبت أو مش متعرف صح." 
        });
    }
    // ----------------------------------

    // لو البرنامج وصل هنا، يبقى السيكشن سليم وله قيمة
    let systemPrompt = "";
    if (typeof selectedPrompt === 'object') {
        systemPrompt = `Prompt ID: ${selectedPrompt.id}, Version: ${selectedPrompt.version}`;
    } else {
        systemPrompt = selectedPrompt;
    }

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
                ],
                temperature: 0.4
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            res.status(200).json({ 
                success: true,
                answer: data.choices[0].message.content 
            });
        } else {
            res.status(500).json({ error: 'حصلت مشكلة في رد OpenAI' });
        }

    } catch (error) {
        res.status(500).json({ error: 'حصلت مشكلة في السيرفر' });
    }
}
