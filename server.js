const express = require('express');
const bodyParser = require('body-parser');
const { CosmosClient } = require('@azure/cosmos');
const app = express();
app.use(bodyParser.json());

const dbConfig = {
    endpoint: 'https://bank1.documents.azure.com:443/',  
    key: 'OudBJbUsjHSMjkuOUgdbZX7tc7bv5yBWByznzjFeYxYCK40CJZPJU0jCLgFycKtcSZ3b4AYJrhUIACDbw61igw==', 
    databaseId: 'ToDoList',           
    containerId: 'Items'               
};

const client = new CosmosClient({ endpoint: dbConfig.endpoint, key: dbConfig.key });

const database = client.database(dbConfig.databaseId);
const container = database.container(dbConfig.containerId);
app.post('/change-password', async (req, res) => { 
    const { username, oldPassword, newPassword } = req.body; 
    const querySpec = { 
        query: 'SELECT * FROM c WHERE c.username = @username AND c.password = @password', 
        parameters: [ { name: '@username', value: username },
            { name: '@password', value: oldPassword } 
        ] };
         try {
             const { resources: users } = await container.items.query(querySpec).fetchAll(); 
             if (users.length > 0) { 
                const user = users[0]; 
                user.password = newPassword; 
                const { resource: updatedUser } = await container.item(user.id).replace(user); 
                res.status(200).send(`Password for user ${updatedUser.id} changed successfully`); 
            } else { 
                res.status(401).send('Invalid credentials'); } } 
                catch (err) { res.status(500).send('Error updating the password'); 
                    console.error('Error updating the password:', err);
                }
            });
// Ruta para el login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const querySpec = {
        query: 'SELECT * FROM c WHERE c.username = @username AND c.password = @password',
        parameters: [
            { name: '@username', value: username },
            { name: '@password', value: password }
        ]
    };

    try {
        const { resources: users } = await container.items.query(querySpec).fetchAll();
        if (users.length > 0) {
            res.redirect('/online.html');
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (err) {
        res.status(500).send('Error querying the database');
        console.error('Error querying the database:', err);
    }
});

// Nueva ruta para añadir usuarios
app.post('/add-user', async (req, res) => {
    const { username, password, name, accountNumber, mensaje1, mensaje2, mensaje3, email } = req.body;

    // Verificar qué datos se están recibiendo en el servidor
    console.log('Received data:', req.body);

    const newUser = {
        id: username,  // La 'id' debe ser única para cada usuario
        username: username,
        password: password,
        name: name,
        accountNumber: accountNumber,
        mensaje1: mensaje1,
        mensaje2: mensaje2,
        mensaje3: mensaje3,
        email: email
    };

    try {
        const { resource: createdUser } = await container.items.create(newUser);
        res.status(201).send(`User ${createdUser.id} created successfully`);
    } catch (err) {
        res.status(500).send('Error adding user to the database');
        console.error('Error adding user to the database:', err);
    }
});

// Ruta para obtener datos del usuario
app.get('/get-user/:username', async (req, res) => {
    const { username } = req.params;
    const querySpec = {
        query: 'SELECT * FROM c WHERE c.username = @username',
        parameters: [{ name: '@username', value: username }]
    };

    try {
        const { resources: users } = await container.items.query(querySpec).fetchAll();
        if (users.length > 0) {
            res.status(200).json(users[0]);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        res.status(500).send('Error querying the database');
        console.error('Error querying the database:', err);
    }
});

app.use(express.static('public'));

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});