import { useState } from 'react'
import axios from 'axios'
import jwtDecode from 'jwt-decode'

function App() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)

  const axiosWithAuth = axios.create()

  axiosWithAuth.interceptors.request.use(async (config) => {
    const currentDate = new Date()
    const decodedToken = jwtDecode(user.access_token)
    if (decodedToken.exp * 1000 < currentDate.getTime()) {
      const data = await refreshToken()
      config.headers["authorization"] = data.access_token
    }
    return config
  }, (error) => Promise.reject(error))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://localhost:5000/api/login', { username, password })
      setUser(response.data)
    } catch(error) {
      alert(error)
    }
  }

  const refreshToken = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/refresh', { refresh_token: user.refresh_token })
      setUser(response.data)
      return response.data
    } catch (error) {
      alert(error)
    }
  }

  const handleDelete = async (id) => {
    setSuccess(false)
    setError(false)
    try {
      await axiosWithAuth.delete('http://localhost:5000/api/users/' + id, {
        headers: { authorization: user.access_token }
      })
      setSuccess(true)
    } catch (err) {
      setError(true)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      {user ? (
        <>
          <h1>Selamat datang di dashboard, {user.is_admin ? 'Admin' : 'User'}</h1>
          <button onClick={() => handleDelete(1)}>Delete Ronaldo</button>
          <button onClick={() => handleDelete(2)}>Delete Benzema</button>
          {error ? 'Anda tidak diizinkan menghapus user ini' : ''}
          {success ? 'Berhasli menghapus user' : ''}
        </>
      ) : (
        <>
          <h1>Silahkan login</h1>
          <form onSubmit={handleSubmit}>
            <input type='text' placeholder='Username' onChange={e => setUsername(e.target.value)} />
            <input type='text' placeholder='Password' onChange={e => setPassword(e.target.value)} />
            <button>Login</button>
          </form>
        </>
      )}
    </div>
  );
}

export default App
