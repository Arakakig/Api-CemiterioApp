const express = require('express');
const { addDataBibiografia, getDataBiografia, getAllBiografia, changeDataBibiografia, uploadArquivo, uploadFotoPerfil, getFeed, addImageVideo, addComentario, addHomenagem, getHomenagens } = require('./api/addData.js'); // Corrigido o caminho do módulo
const cors = require('cors');
const app = express();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GB em bytes
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getUser, isLogged, cadastrarUser, cadastrarUserGoogle, loginComGoogle, addEditorFalecido } = require('./api/authentication.js');
const genAI = new GoogleGenerativeAI('AIzaSyDbdGkw6FHzSGReWGcDgHb-1AYJ60T0X-8');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
const path = require('path');

// Middleware para interpretar JSON no corpo das requisições
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Rota principal
app.get('/api/', (req, res) => {
    res.send('Hello World!');
});

app.get('/api/biografia', async (req, res) => {
    try {
        const data = await getAllBiografia();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar dados', error: error.message });
    }
});

app.get('/api/biografia/:id', async (req, res) => {
    try {
        const dataReceived = req.params.id;
        const data = await getDataBiografia(dataReceived);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar dados', error: error.message });
    }
});
// Rota para adicionar dados à bibliografia
app.post('/api/addBiografia', async (req, res) => {
    try {
        const data = await req.body; // Dados enviados no corpo da requisição
        console.log(req.body)
        const result = await addDataBibiografia(data);
        res.status(200).json({ message: 'Dados adicionados com sucesso!', result });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar dados', error: error.message });
    }
});

app.put('/api/addBiografia', upload.single('file'), async (req, res) => {
    try {
        const data = req.body; // Captura os campos enviados
        const fileAux = req.file;
        delete data.file;
        let perfilUrl;
        // Processa o arquivo de foto de perfil, caso haja
        if (fileAux) {
            perfilUrl = await uploadArquivo(data, fileAux); // Função para manipular o arquivo
        }

        // Aqui você pode manipular os outros dados, como músicas e biografia, e salvar no banco
        const result = await changeDataBibiografia(data, perfilUrl);

        res.status(200).json({ message: 'Dados adicionados com sucesso!', result });
    } catch (error) {
        console.error('Erro ao processar requisição:', error);
        res.status(500).json({ message: 'Erro ao adicionar dados', error: error.message });
    }
});

app.get('/api/feed/:id', upload.single('file'), async (req, res) => {
    try {
        const dataReceived = req.params.id;
        const data = await getFeed(dataReceived);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar dados', error: error.message });
    }
});
app.post('/api/addFeed', upload.single('file'), async (req, res) => {
    try {
        const data = req.body; // Captura os campos enviados
        const fileAux = req.file;
        // Processa o arquivo de foto de perfil, caso haja
        if (fileAux) {
            perfilUrl = await uploadArquivo(data, fileAux); // Função para manipular o arquivo
        }
        console.log(perfilUrl)
        // Aqui você pode manipular os outros dados, como músicas e biografia, e salvar no banco
        const result = await addImageVideo(data, perfilUrl);
        console.log(result)
        res.status(200).json({ data: result, message: 'Dados adicionados com sucesso!' });
    } catch (error) {
        console.error('Erro ao processar requisição:', error);
        res.status(500).json({ message: 'Erro ao adicionar dados', error: error.message });
    }
});


app.post('/api/addComentario', async (req, res) => {
    try {
        const data = req.body; // Captura os campos enviados
        console.log(data)
        const result = await addComentario(data);
        res.status(200).json({ data: result, message: 'Dados adicionados com sucesso!' });
    } catch (error) {
        console.error('Erro ao processar requisição:', error);
        res.status(500).json({ message: 'Erro ao adicionar dados', error: error.message });
    }
});

app.get('/api/homenagens/:id', upload.single('file'), async (req, res) => {
    try {
        const dataReceived = req.params.id;
        const data = await getHomenagens(dataReceived);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar dados', error: error.message });
    }
});

app.post('/api/addHomenagens', async (req, res) => {
    try {
        const data = req.body; // Captura os campos enviados
        console.log(data);
        const result = await addHomenagem(data);
        res.status(200).json({ data: result, message: 'Dados adicionados com sucesso!' });
    } catch (error) {
        console.error('Erro ao processar requisição:', error);
        res.status(500).json({ message: 'Erro ao adicionar dados', error: error.message });
    }
});

app.post('/api/reformularTexto', async (req, res) => {
    const prompt = 'melhore esse texto, deixe-o no minimo com 200 palavras: ' + req.body.text;

    try {
        const result = await model.generateContent(prompt);
        res.json({ prompt, result });
    } catch (error) {
        console.error('Erro ao gerar conteúdo:', error);
        res.status(500).json({ error: 'Erro ao processar o prompt.' });
    }
});

//Login
app.post('/api/login', async (req, res) => {
    try {
        const user = req.body;
        const data = await getUser(user);
        if (data) {
            console.log(data)
            res.json(data);
        } else {
            res.status(400).json({ message: 'Usuário ou senha inválidos' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Usuário ou senha inválidos' });
    }
})

app.post('/api/loginGoogle', async (req, res) => {
    try {
        const user = req.body;
        const data = await loginComGoogle(user);
        if (data) {
            console.log(data)
            res.json(data);
        } else {
            res.status(400).json({ message: 'Usuário ou senha inválidos' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Usuário ou senha inválidos' });
    }
})


//Cadastrar
app.post('/api/cadastrarUser', async (req, res) => {
    try {
        const user = req.body;
        const data = await cadastrarUser(user);
        if (data) {
            console.log(data)
            res.json(data);
        } else {
            res.status(400).json({ message: 'Usuário ou senha inválidos' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Usuário ou senha inválidos' });
    }
})

app.post('/api/cadastrarUserGoogle', async (req, res) => {
    try {
        const user = req.body;
        const data = await cadastrarUserGoogle(user);
        if (data) {
            console.log(data)
            res.json(data);
        } else {
            res.status(400).json({ message: 'Usuário ou senha inválidos' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Usuário ou senha inválidos' });
    }
})

app.post('/api/addEditorFalecido', async (req, res) => {
    try {
        const data = req.body;
        const result = await addEditorFalecido(data);
        console.log(result)
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar editor', error: error.message });
    }
})

app.get('/api/isLogged', async (req, res) => {
    const token = req.header('x-access-token');
    if (!token) return res.status(400).json({ message: 'Usuário não autenticado' });
    try {
        const data = await isLogged(token);
        res.json(data);
    } catch (error) {
        res.status(400).json({ message: 'Usuário não autenticado' });
    }
})


const { saveCodes, listCodes } = require('./api/codigos');

app.post('/api/codigos', async (req, res) => {
    try {
        const payload = req.body || {};
        const { codes } = payload;
        const result = await saveCodes(codes);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Erro ao salvar códigos' });
    }
});

app.get('/api/codigos', async (req, res) => {
    try {
        const items = await listCodes();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar códigos' });
    }
});

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// Start server only when running locally; export app for serverless environments (e.g., Vercel)
if (require.main === module) {
	const port = process.env.PORT || 3000;
	app.listen(port, () => {
		console.log('Order API is running at ' + port);
	});
}

module.exports = app;