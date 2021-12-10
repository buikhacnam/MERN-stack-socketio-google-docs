const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, {
	cors: {
		origin: '*',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
	},
})
const mongoose = require('mongoose')
const Document = require('./Document')

app.get('/', (req, res) => {
	res.send('<h1>Hello world</h1>')
})

const defaultValue = ""

io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: defaultValue })
}

mongoose
	.connect('mongodb://localhost:27017/google-docs-clone', {
		useNewUrlParser: true,
	})
	.then(() => {
		server.listen(5000, () => {
			console.log('listening on *:5000')
		})
	})
	.catch(err => console.log(err))
