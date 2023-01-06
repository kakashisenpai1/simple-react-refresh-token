const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const cors = require('cors')

app.use(express.json())
app.use(cors())

const users = [
  { id: '1', username: 'ronaldo', password: '1234', isAdmin: true },
  { id: '2', username: 'benzema', password: '1234', isAdmin: false },
]

let refreshTokens = []

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, isAdmin: user.isAdmin }, 
    'secretKey',
    { expiresIn: '5s' }
  )
}

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, 'secretKey2')
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body
  const user = users.find(u => u.username === username && u.password === password)
  if (user) {
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)
    refreshTokens.push(refreshToken)
    res.json({ 
      access_token: accessToken, 
      refresh_token: refreshToken, 
      is_admin: user.isAdmin 
    })
  }
  else res.status(401).json('kredensial login salah')
})

app.post('/api/refresh', (req, res) => {
  const refreshToken = req.body.refresh_token
  if (!refreshToken) return res.status(401).json('tidak ada refresh token')
  if (!refreshTokens.includes(refreshToken)) return res.status(403).json('refresh token tidak ada di database')
  jwt.verify(refreshToken, 'secretKey2', (err, refreshTokenData) => {
    if (err) return res.json(403).json('refresh token tidak valid')
    refreshTokens = refreshTokens.filter(refToken => refToken !== refreshToken)
    const newAccessToken = generateAccessToken(refreshTokenData)
    const newRefreshToken = generateRefreshToken(refreshTokenData)
    refreshTokens.push(newRefreshToken)
    res.json({ 
      access_token: newAccessToken, 
      refresh_token: newRefreshToken, 
      is_admin: refreshTokenData.isAdmin 
    })
  })
})

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader
    jwt.verify(token, 'secretKey', (err, tokenData) => {
      if (err) return res.status(403).json('token tidak valid')
      req.user = tokenData
      next()
    })
  } else res.status(401).json('anda tidak punya token')
}

app.delete('/api/users/:id', verify, (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) res.json('berhasil hapus user')
  else res.status(403).json('anda tidak berhak menghapus user ini')
})

app.post('/api/logout', verify, (req, res) => {
  const refreshToken = req.body.refresh_token
  refreshTokens = refreshTokens.filter(refToken => refToken !== refreshToken)
  res.json('berhasil logout, data refresh token di hapus di database')
})

app.listen(5000, () => console.log('backend berjalan'))
