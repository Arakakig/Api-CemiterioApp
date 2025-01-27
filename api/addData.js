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
        const id = uniKey(20);
        let dataAux = { ...dataReceived };
        if (perfilUrl) {
            dataAux.url = perfilUrl
        }
        console.log(dataAux)
        await setDoc(doc(db, "feed", id), { ...dataAux });
        return dataAux;
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error.message);
        return null;
    }
}


async function addComentario(dataReceived) {
    try {
        // Referência ao documento no Firestore
        const docRef = doc(db, "feed", dataReceived.idImagem);

        // Cria ou atualiza o campo de comentários
        await setDoc(
            docRef,
            {
                comentarios: arrayUnion(dataReceived), // Adiciona um novo comentário no array
            },
            { merge: true } // Garante que outros campos existentes não serão sobrescritos
        );

        return { success: true, message: "Comentário adicionado com sucesso!" };
    } catch (error) {
        console.error("Erro ao adicionar comentário:", error.message);
        return { success: false, error: error.message };
    }
}

async function addHomenagem(dataReceived) {
    try {
        // Referência ao documento no Firestore
        const docRef = doc(db, "homenagens", dataReceived.id);

        // Cria ou atualiza o campo de comentários
        await setDoc(
            docRef,
            {
                comentarios: arrayUnion(dataReceived), // Adiciona um novo comentário no array
            },
            { merge: true } // Garante que outros campos existentes não serão sobrescritos
        );

        return { success: true, message: "Comentário adicionado com sucesso!" };
    } catch (error) {
        console.error("Erro ao adicionar comentário:", error.message);
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
        const data = [];

        const querySnap = await getDocs(
            query(
                collection(db, "homenagens"),
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
    const dataAux = { ...data }
    const nomeArquivo = `/${dataAux.id ? dataAux.id : dataAux.idFalecido}/${uniKey(10)}.png`
    console.log(nomeArquivo)
    const storageRef = ref(storage, nomeArquivo);
    try {
        const snapshot = await uploadBytes(storageRef, file.buffer);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error('Erro ao fazer upload:', error.message);
        throw error;
    }
}

module.exports = { addComentario, getHomenagens, addDataBibiografia, getDataBiografia, getAllBiografia, changeDataBibiografia, uploadArquivo, addImageVideo, getFeed , addHomenagem};
