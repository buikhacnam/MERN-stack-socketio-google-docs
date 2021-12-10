import React, { useCallback, useEffect, useState } from 'react'
import 'quill/dist/quill.snow.css'
import Quill from 'quill'
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'

const TOOLBAR_OPTIONS = [
	[{ header: [1, 2, 3, 4, 5, 6, false] }],
	[{ font: [] }],
	[{ list: 'ordered' }, { list: 'bullet' }],
	['bold', 'italic', 'underline'],
	[{ color: [] }, { background: [] }],
	[{ script: 'sub' }, { script: 'super' }],
	[{ align: [] }],
	['image', 'blockquote', 'code-block'],
	['clean'],
]

type TODO = any
interface Props {}

const TextEditor: React.FC<Props> = () => {
	const params = useParams()
	const { id: documentId } = params
	const [socket, setSocket] = useState<TODO>(null)
	const [quill, setQuill] = useState<TODO>(null)

	//connect to socket
	useEffect(() => {
		const socketio = io('http://localhost:5000')
		setSocket(socketio)

		return () => {
			socketio.disconnect()
		}
	}, [])

	//get document
	useEffect(() => {
		if (socket === null || quill === null) return
		socket.once('load-document', (document: TODO) => {
			quill.setContents(document)
			quill.enable()
		})
		socket.emit('get-document', documentId)
	}, [socket, quill, documentId])

	// onchange in quill
	useEffect(() => {
		if (socket === null || quill === null) return
		const handler = (delta: TODO, oldDelta: TODO, source: TODO) => {
			// make sure only track changes from user
			if (source !== 'user') return
			// delta here is the change made by user
			socket.emit('send-changes', delta)
		}
		quill.on('text-change', handler)

		return () => {
			quill.off('text-change', handler)
		}
	}, [socket, quill])

	//update changes made from other users
	useEffect(() => {
		if (socket === null || quill === null) return
		const handler = (delta: TODO) => {
			quill.updateContents(delta)
		}
		socket.on('receive-changes', handler)

		return () => {
			socket.off('receive-changes', handler)
		}
	}, [quill, socket])

	//auto save document
	useEffect(() => {
		if (socket === null || quill === null) return
		const interval = setInterval(() => {
			console.log('content', quill.getContents())
			socket.emit('save-document', quill.getContents())
		}, 2000)

		return () => {
			clearInterval(interval)
		}
	}, [quill, socket])

	//create quill editor
	const wrapperRef = useCallback((wrapper: HTMLDivElement) => {
		if (wrapper === null) return
		wrapper.innerHTML = ''
		const editor = document.createElement('div')
		wrapper.appendChild(editor)
		const q = new Quill(editor, {
			theme: 'snow',
			modules: { toolbar: TOOLBAR_OPTIONS },
		})
		q.disable()
		q.setText('Loading...')
		setQuill(q)
	}, [])
	return (
		<>
			<div className='container' ref={wrapperRef}></div>
		</>
	)
}

export default TextEditor

// ! in typescript: That's the non-null assertion operator. It is a way to tell the compiler "this expression cannot be null or undefined here, so don't complain about the possibility of it being null or undefined." Sometimes the type checker is unable to make that determination itself. For example, if you have a function that returns a value of type string, and you call that function with a value of type number, the type checker can't know whether to return a string or throw an error.
