const express = require('express');
const cors = require('cors');
const path = require('path'); 
const sqlite = require('sqlite');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const axios = require('axios');
const httpresponse = require('http');
const app = express();
app.use(cors())

app.use(express.json());

const dbpath = path.join(__dirname, 'Mhealth.db')

let db = null

const initializeDbServer = async () => {
    try {
        db = await open({ filename: dbpath, driver: sqlite3.Database });
        console.log('Database connected successfully');
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                dob DATE NOT NULL,
                contact INT NOT NULL,
                email_id VARCHAR(255) NOT NULL,
                user_description TEXT
            )
        `;
        await db.exec(createTableQuery);

        app.listen(3000, () => console.log('Server Running at http://localhost:3000/'));
       
    } catch (error) {
        console.log(`Failed to connect ${error.message}`);
        process.exit(1);
    }
};
initializeDbServer()

app.post('/users/create', async (req, res) => {
    try {
        const { name, dob, contact, email_id, user_description } = req.body;

        const query = `
            INSERT INTO Users (name, dob, contact, email_id, user_description)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await db.run(query, [name, dob, contact, email_id, user_description]);
        const lastInsertId = result.lastID;

        console.log(`A row has been inserted with rowid ${lastInsertId}`);
        res.status(201).json({
            message: 'User created successfully',
            id: lastInsertId
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});


app.get('/users', async (req, res) => {
    const query = `SELECT * FROM users`
    const dbresponse = await db.all(query)
    if (dbresponse.length === 0) {
        return res.status(404).json({ message: 'No users found' })
    }
    else {
        return res.status(200).json(dbresponse)
    }
})

app.put('/users/:id',async(req, res) => {
        try {
            
            const {name, dob, contact, email_id, user_description} = req.body
            const query = `UPDATE Users SET name =?, dob =?, contact =?, email_id =?, user_description =? WHERE id =?`;
            const dbresponse= await db.run(query, [name, dob, contact, email_id, user_description, req.params.id])
            const lastInsertId= dbresponse.lastID
            console.log(`A row has been updated with rowid ${lastInsertId}`);
            res.status(200).json({message:"updated successfully", id:lastInsertId})

        } catch (error) {
            console.log(error.message)
            res.status(500).json({error:error.message})
        }
})

app.delete('/users/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const deleteQuery = `DELETE FROM Users WHERE id = ?`;

        const result = await db.run(deleteQuery, id);

        if (result.changes > 0) {
            console.log(`User with id ${id} deleted successfully.`);
            res.status(200).json({
                message: 'User deleted successfully',
                id: id
            });
        } else {
            console.log(`User with id ${id} not found.`);
            res.status(404).json({
                message: 'User not found',
                id: id
            });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/user/:id', async (req, res) => {
   try {
    const id= req.params.id

    const query = `SELECT * FROM users WHERE id = ${id}`
    const dbresponse = await db.get(query)
    if (dbresponse) {
        return res.status(200).json(dbresponse)
    } else {
        return res.status(404).json({ message: 'No user found' })
    }
   } catch (error) {
    res.status(500).json({ error: error.message });
   }
    
})

app.get('/user/:search', async(req, res)=>{
    try {
        const search = req.params.search
        const query = `SELECT * FROM Users WHERE name LIKE '%${search}%'`
        const dbresponse = await db.all(query)
        if (dbresponse.length === 0) {
            return res.status(404).json({ message: 'No users found' })
        }
        else {
            return res.status(200).json(dbresponse)
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ error: error.message })
    }
})