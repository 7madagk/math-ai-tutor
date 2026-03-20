export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    console.log('Body received:', JSON.stringify(req.body));

    const { messages, sectionId } = req.body;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    const prompts = {
        'A': `انت مدرس فزياء`,
        'B': null,
        'C': null,
        'D': null
    };

    const selectedPrompt = prompts[sectionId];

    if (!selectedPrompt) {
        return res.status(400).json({
            success: false,
            answer: "يا برنس، السيكشن ده لسه تحت الإنشاء، جرب الجزء (أ) دلوقتي."
        });
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
                    { role: "system", content: selectedPrompt },
                    ...messages
                ],
                temperature: 0.4,
                max_tokens: 10000,
                stream: true
            })
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6);
                if (data === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
                try {
                    const parsed = JSON.parse(data);
                    const token = parsed.choices?.[0]?.delta?.content || '';
                    if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
                } catch {}
            }
        }
        res.end();

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ success: false, answer: "حصل خطأ في الاتصال بالسيرفر، جرب تاني." });
    }
}
