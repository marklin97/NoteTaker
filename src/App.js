import React, { useState } from 'react'
import { withAuthenticator } from 'aws-amplify-react'
import { API, graphqlOperation } from 'aws-amplify'
import { createNote } from './graphql/mutations'
const App = () => {
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState([])

  const handleChangeNote = e => setNote(e.target.value)

  const handleAddNote = async e => {
    e.preventDefault()

    const input = { note: note }
    console.log(input)
    // send request
    const result = await API.graphql(
      graphqlOperation(createNote, { input: input })
    )
    // retrieve data
    const newNode = result.data.createNote

    const updatedNotes = [newNode, ...notes]
    setNote('')
    setNotes(updatedNotes)
  }

  return (
    <div className='flex flex-column items-center justify-center pa3 bg-washed-red'>
      <h1 className='code f2-1'>Amplify Notetaker</h1>
      <form className='mb3' onSubmit={handleAddNote}>
        <input
          type='text'
          className='pa2 f4'
          placeholder='Write your note'
          onChange={handleChangeNote}
          value={note}
        />
        <button className='pa2 f4' type='submit'>
          Add Note
        </button>
      </form>
      <div>
        {notes.map(item => (
          <div key={item.id} className='flex items-center'>
            <li className='list pa1 f3'>
              {item.note}
              <button className='bg-transparent bn f4'>
                <span>&times;</span>
              </button>
            </li>
          </div>
        ))}
      </div>
    </div>
  )
}
export default withAuthenticator(App, { includeGreetings: true })
