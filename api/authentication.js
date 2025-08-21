const { db } = require('../firebase');
const { collection, query, where, getDocs, doc, getDoc, setDoc, arrayUnion } = require('firebase/firestore');
const { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } = require('../firebase');
const jwt = require('jsonwebtoken');
const { uniKey } = require('../functions');
require('dotenv').config()
const JWT_SECRET = 'NIKKEITECH123' 

async function getUser(data) {
    const login = data.user;
    const senha = data.password;

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", login), where("password", "==", senha));
    try {
        const querySnapshot = await getDocs(q);
        const user = querySnapshot.docs[0];
        console.log(login, senha)
        const data = user.data()
        if (user) {
            const token = jwt.sign({ userId: user.id, permission: data.type }, JWT_SECRET, { expiresIn: '24h' });
            return { token, data };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting documents: ", error);
        return null;
    }
}

function verificarToken(req, res, next) {
    const token = req.header('x-access-token');
    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido' });
        }
        req.userId = decoded.userId;
        req.permission = decoded.permission;
        next();
    });
}

async function cadastrarUser(data) {
    try {
        // Verifica se o usuário já está registrado
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        console.log(user.uid)
        const dataUser = {
            id: user.uid,
            email: data.email,
            password: data.password,
            type: 1,
            dataCreated: new Date()
        }
        const docRef = await setDoc(doc(db, "users", dataUser.id), dataUser);
        const token = jwt.sign({ userId: user.uid, permission: dataUser.type }, JWT_SECRET, { expiresIn: '48h' });

        return { success: true, token, userId: dataUser.id };
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        return { success: false, message: "Erro ao cadastrar usuário." };
    }
}

async function addEditorFalecido(data) {
    const docRef = doc(db, "falecido", data.falecidoId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        await setDoc(docRef, { editores: arrayUnion(data.email), dataCreated: new Date() }, { merge: true });
        return { success: true, message: "Editor adicionado com sucesso." };
    } else {
        return { success: false, message: "Falecido não encontrado." };
    }
}

async function cadastrarUserGoogle(data) {
    try {
        // Verifica se o usuário já está registrado
        console.log(data)
        const dataUser = {
            id: data.googleId,
            email: data.email,
            type: 1,
            dataCreated: new Date()
        }
        const docRef = await setDoc(doc(db, "users", dataUser.id), dataUser);
        const token = jwt.sign({ userId: dataUser.id, permission: dataUser.type }, JWT_SECRET, { expiresIn: '48h' });

        return { success: true, token, userId: dataUser.id };
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        return { success: false, message: "Erro ao cadastrar usuário." };
    }
}


async function loginComGoogle(data) {
    try {
        console.log(data)
        const docRef = doc(db, "users", data.googleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const dataResult =  docSnap.data();
            const token = jwt.sign({ userId: dataResult.id, email: dataResult.email }, JWT_SECRET, { expiresIn: '48h' });
            return { token, data: dataResult };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Erro no login com Google:", error);
        return null;
    }
}

async function isLogged(token) {

    try {
        const decoded = await jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const user = docSnap.data();
            return user
        }
        else {
            throw new Error('Usuário não autenticado');
            return null;
        }
    } catch (error) {
        throw new Error('Usuário não autenticado');
        return null;
    }
}

async function havePermissionEditor(req, res, next) {
    try {
        const token = req.header('x-access-token');
        const decoded = await jwt.verify(token, JWT_SECRET);
        const permissao = decoded.permission;
        if (permissao === 0 || permissao === 1) {
            next();
        }
        else {
            return res.status(401).json({ message: 'Usuário sem permissão' });

        }
    } catch (error) {
        return res.status(401).json({ message: 'Usuário sem permissão' });
    }
}
async function havePermissionAdministrador(req, res, next) {
    try {
        const token = req.header('x-access-token');
        const decoded = await jwt.verify(token, JWT_SECRET);
        const permissao = decoded.permission;
        if (permissao === 0) {
            next();
        }
        else {
            return res.status(401).json({ message: 'Usuário sem permissão' });
        }
    } catch (error) {
        return res.status(401).json({ message: 'Usuário sem permissão' });

    }
}
module.exports = { loginComGoogle, cadastrarUserGoogle, cadastrarUser, getUser, verificarToken, isLogged, havePermissionEditor,addEditorFalecido, havePermissionAdministrador };
