const { db, storage } = require('../firebase');
const { uniKey } = require('../functions');
const { doc, getDocs, collection, setDoc, query, where, limit, getDoc, updateDoc, arrayUnion } = require("firebase/firestore")
const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");


async function getAllBiografia() {
    try {
        const data = [];

        const querySnap = await getDocs(
            query(
                collection(db, "falecido"),
            )
        );
        querySnap.forEach((doc) => {
            data.push(doc.data());
        });
        return data;
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error.message);
        return null;
    }
}

async function getDataBiografia(id) {
    try {
        const docRef = doc(db, "falecido", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error.message);
        return null;
    }
}

async function addDataBibiografia(dataReceived) {
    try {
        const id = uniKey(20)
        await setDoc(doc(db, "falecido", id), { ...dataReceived });
        return dataReceived;
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error.message);
        return null;
    }
}

async function addImageVideo(dataReceived, perfilUrl) {
    try {
        let dataAux = { ...dataReceived };
        if (perfilUrl) {
            dataAux.url = perfilUrl
        }
        console.log(dataAux)
        await setDoc(doc(db, "feed", dataAux.id), { ...dataAux });
        return dataAux;
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error.message);
        return null;
    }
}


async function addComentario(dataReceived) {
    try {
        // Referência ao documento no Firestore
        console.log(dataReceived)
        const docRef = doc(db, "feed", dataReceived.idImagem);
        const snap = await getDoc(docRef);
        console.log(snap.data())
        const existing = snap.exists() ? snap.data().comentarios : undefined;

        // Garante que o campo seja um array
        if (!Array.isArray(existing)) {
            await setDoc(
                docRef,
                { comentarios: [dataReceived] },
                { merge: true }
            );
        } else {
            // Adiciona ao array existente
            await setDoc(
                docRef,
                { comentarios: arrayUnion(dataReceived) },
                { merge: true }
            );
        }

        return { success: true, message: "Comentário adicionado com sucesso!" };
    } catch (error) {
        console.error("Erro ao adicionar comentário:", error.message);
        return { success: false, error: error.message };
    }
}

async function addHomenagem(dataReceived) {
    try {
        // Referência ao documento do falecido no Firestore
        const falecidoId = dataReceived.idFalecido || dataReceived.id;
        const docRef = doc(db, "falecido", falecidoId);

        const snap = await getDoc(docRef);
        const existing = snap.exists() ? snap.data().homenagens : undefined;

        // Garante que o campo seja um array
        if (!Array.isArray(existing)) {
            await setDoc(
                docRef,
                { homenagens: [dataReceived] },
                { merge: true }
            );
        } else {
            // Adiciona ao array existente
            await setDoc(
                docRef,
                { homenagens: arrayUnion(dataReceived) },
                { merge: true }
            );
        }

        return { success: true, message: "Homenagem adicionada com sucesso!" };
    } catch (error) {
        console.error("Erro ao adicionar homenagem:", error.message);
        return { success: false, error: error.message };
    }
}

async function getFeed(id) {
    try {
        const data = [];

        const querySnap = await getDocs(
            query(
                collection(db, "feed"),
                where('idFalecido', "==", id)
            )
        );
        querySnap.forEach((doc) => {
            data.push(doc.data());
        });
        return data;
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error.message);
        return null;
    }
}

async function getHomenagens(id) {
    try {
        const docRef = doc(db, "falecido", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const dadosFalecido = docSnap.data();
            return dadosFalecido.homenagens || [];
        }
        return [];
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error.message);
        return null;
    }
}
async function changeDataBibiografia(dataReceived, foto = null) {
    try {
        let dataAux = { ...dataReceived };
        if (foto) {
            dataAux.fotoPerfil = foto;
        }
        console.log(dataAux)
        await setDoc(doc(db, "falecido", dataAux.id), dataAux);
        return dataAux; // Retorna diretamente o conteúdo
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error.message);
        return null;
    }
}


async function uploadArquivo(data, file) {
    const dataAux = { ...data };
    const falecidoId = dataAux.id ? dataAux.id : dataAux.idFalecido;
    const subDiretorio = dataAux.idFalecido ? 'feed' : 'perfil';

    // Define a extensão do arquivo a partir do nome original ou do mimetype
    const originalName = file.originalname || '';
    const extFromName = originalName.includes('.') ? originalName.split('.').pop() : '';
    const extFromMime = (file.mimetype && file.mimetype.split('/')[1]) || '';
    const extensao = (extFromName || extFromMime || 'bin').toLowerCase();

    const nomeArquivo = `falecidos/${falecidoId}/${subDiretorio}/${Date.now()}-${uniKey(10)}.${extensao}`;
    console.log('Caminho de upload:', nomeArquivo);

    const storageRef = ref(storage, nomeArquivo);
    const metadata = file.mimetype ? { contentType: file.mimetype } : undefined;

    try {
        await uploadBytes(storageRef, file.buffer, metadata);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error('Erro ao fazer upload:', error.message);
        throw error;
    }
}

module.exports = { addComentario, getHomenagens, addDataBibiografia, getDataBiografia, getAllBiografia, changeDataBibiografia, uploadArquivo, addImageVideo, getFeed , addHomenagem};
