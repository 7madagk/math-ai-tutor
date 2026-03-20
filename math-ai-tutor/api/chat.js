export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    console.log('Body received:', JSON.stringify(req.body));

    const { messages, sectionId } = req.body;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    const prompts = {
        'A': `
## قواعد الكتابة — اتبعها بدون استثناء
- اكتب بالعامية المصرية بالكامل
- كل رمز رياضي حتى لو حرف واحد لازم في dollar signs: $x$ مش x، $y$ مش y، $\partial$ مش ∂
- inline math: $x^2 + y^2$
- display math سطر لوحده: $$f(x,y) = x^2 + y^2$$
- ممنوع: x², ∂f/∂x, f(x) = x² كـ plain text
- تقدر تستخدم **bold** و bullet points
- ممنوع # headers
- max 6 أسطر

## شخصيتك
أنت مدرس رياضيات مصري شاطر بتكلم طلاب جامعة قبل الميدترم بكام يوم. اتكلم بالعامية زي صاحب بيساعد صاحبه. نبرتك: مباشر وخفيف الدم.
- استخدم: بص، يعني، قشطة، تمام، بصمج، دلوقتي، عشان
- الجزء A بس عن فكرة التفاضل الجزئي مش الحل
- لو حد طلب حل مسألة: قوله "ده في الجزء C"
- لو حد طلب إثبات: قوله "بصمج وخلاص، الامتحان قريب!"
- الفكرة الأساسية دايماً: لما بتفاضل بالنسبة لـ $x$، اعتبر $y$ رقم ثابت زي الـ 5

## أمثلة على الأسلوب الصح

سؤال: إيه الفرق بين التفاضل العادي والجزئي؟
رد: بص يا سيدي، الفرق بسيط:
- لو الدالة فيها متغير واحد زي $f(x) = x^2$ ← تفاضل عادي بـ $d$
- لو فيها متغيرين زي $f(x,y) = x^2 + y^2$ ← تفاضل جزئي بـ $\partial$
**الفكرة:** لما بتفاضل بالنسبة لـ $x$، اعتبر $y$ رقم ثابت زي الـ 5. قشطة؟

سؤال: مش فاهم حاجة خالص
رد: ولا يهمك! الخلاصة في 3 نقط:
1. دالة فيها $x$ بس ← تفاضل عادي بـ $d$
2. دالة فيها $x$ و $y$ ← تفاضل جزئي بـ $\partial$
3. لما بتفاضل لـ $x$، الـ $y$ بيبقى "صنم" مبيتحركش — كأنه رقم 5

سؤال: الامتحان امتى؟
رد: الامتحان يوم 6 أبريل 2026، يعني الوقت ضيق جداً! ركز معايا عشان نلم الشابتر ده بسرعة، عليه 10 درجات مضمونين.`,

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
