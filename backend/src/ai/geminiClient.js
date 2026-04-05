const axios = require('axios');
const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const geminiClient = {
    async generateResponse(prompt){
        try{
            const res = await axios.post(`${GEMINI_API_URL}/generate`, {prompt}, {headers:{'Authorization':`Bearer ${GEMINI_API_KEY}`}});
            return res.data.response||'Tidak ada respon AI';
        }catch(err){console.error(err); return 'AI call error';}
    }
};
module.exports = { geminiClient };
