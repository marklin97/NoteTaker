import React, { useState, useEffect } from 'react'
import { withAuthenticator } from 'aws-amplify-react'
import { API, graphqlOperation, Auth } from 'aws-amplify'
import { createNote, deleteNote, updateNote } from './graphql/mutations'
import { listNotes } from './graphql/queries'
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote
} from './graphql/subscriptions'
const App = () => {
  const [id, setId] = useState('')
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState([])

  const handleChangeNote = e => setNote(e.target.value)
  async function fetchNotes () {
    const result = await API.graphql(graphqlOperation(listNotes))
    await console.log(Auth.currentAuthenticatedUser())
    setNotes(result.data.listNotes.items)
  }

  useEffect(() => {
    fetchNotes()

    const createNoteListener = getUser().then(user => {
      return API.graphql(
        graphqlOperation(onCreateNote, { owner: user.username })
      ).subscribe({
        next: noteData => {
          const newNote = noteData.value.data.onCreateNote
          setNotes(prevState => {
            const prevNotes = prevState.filter(item => item.id !== newNote.id)
            return [...prevNotes, newNote]
          })
        }
      })
    })
    const deleteNoteListener = getUser().then(user => {
      return API.graphql(
        graphqlOperation(onDeleteNote, { owner: user.username })
      ).subscribe({
        next: noteData => {
          const deletedNote = noteData.value.data.onDeleteNote
          setNotes(prevState => {
            const updatedNotes = prevState.filter(
              note => note.id !== deletedNote.id
            )
            return updatedNotes
          })
        }
      })
    })
    const updateNoteListener = getUser().then(user => {
      return API.graphql(
        graphqlOperation(onUpdateNote, { owner: user.username })
      ).subscribe({
        next: noteData => {
          const updatedNote = noteData.value.data.onUpdateNote
          setNotes(prevNotes => {
            const index = prevNotes.findIndex(
              note => note.id === updatedNote.id
            )
            const updatedNotes = [
              ...prevNotes.slice(0, index),
              updatedNote,
              ...prevNotes.slice(index + 1)
            ]
            return updatedNotes
          })
          setNote('')
          setId('')
        }
      })
    })
    return () => {
      createNoteListener.unsubscribe()
      deleteNoteListener.unsubscribe()
      updateNoteListener.unsubscribe()
    }
  }, [])

  const handleAddNote = async e => {
    e.preventDefault()

    // check if we have an existing note, if so update
    if (hasExistingNote()) {
      handleUpdateNote()
    } else {
      const input = { note }
      // send request
      await API.graphql(graphqlOperation(createNote, { input: input }))
      setNote('')
    }
  }
  const handleDeleteNote = async noteId => {
    const input = { id: noteId }
    await API.graphql(graphqlOperation(deleteNote, { input: input }))
  }
  const handleSetNote = ({ note, id }) => {
    setNote(note)
    setId(id)
  }
  const getUser = async () => {
    const user = await Auth.currentUserInfo()

    return user
  }
  const hasExistingNote = () => {
    /**
     * findIndex return -1 if the target id is not found,
     * comparion to -1 returns the boolean value
     * the current id is set when you clicked the item of the list
     */
    if (id) {
      const isNote = notes.findIndex(note => note.id === id) > -1
      return isNote
    }
    return false
  }
  const handleUpdateNote = async () => {
    const input = { id, note }
    await API.graphql(graphqlOperation(updateNote, { input }))
  }
  return (
    <div className='flex flex-column items-center bg-washed-red'>
      <h1 className='code f2-1'>Amplify Notetaker</h1>
      <form className='mb2' onSubmit={handleAddNote}>
        <input
          type='text'
          className='pa2 f4'
          placeholder='Write your note'
          onChange={handleChangeNote}
          value={note}
        />
        <button className='pa2 f4' type='submit'>
          {id ? 'Update Note' : 'Add Note'}
        </button>
      </form>
      {/* Notes List */}
      <div>
        {notes.map(item => (
          <div key={item.id} className='flex items-center'>
            <li onClick={() => handleSetNote(item)} className='list pa1 f3'>
              {item.note}
            </li>
            <button
              onClick={() => handleDeleteNote(item.id)}
              className='bg-transparent bn f4'
            >
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
export default withAuthenticator(App, { includeGreetings: true })
