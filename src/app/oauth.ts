import axios from 'axios'
import User from '../modules/users/model'
import * as shortid from 'shortid'

const { CLIENT_ID, CLIENT_SECRET } = require('../config')

async function oauth (req: any, res: any) {
  const code = req.query.code
  console.log('session', req.session)
  console.log('authorization code:', code, req.cookies)
  const userInfo = await getUserData(code).catch(err => {
    failure(err, req, res)
  })

  // console.log('userInfo::::', userInfo)

  success('githubId', req, res, {
    id: userInfo.id,
    name: userInfo.login,
    avatar: userInfo.avatar_url,
  })
}

async function getUserData (code: string) {
  const tokenResponse = await axios({
    method: 'post',
    url: 'https://github.com/login/oauth/access_token?' +
      `client_id=${CLIENT_ID}&` +
      `client_secret=${CLIENT_SECRET}&` +
      `code=${code}`,
    headers: {
      accept: 'application/json'
    }
  })

  const accessToken = tokenResponse.data.access_token
  console.log(`access token: ${accessToken}`)

  const result = await axios({
    method: 'get',
    url: `https://api.github.com/user`,
    headers: {
      accept: 'application/json',
      // Authorization: `token 49ca725d22e4eabd3f1944da3d7c95e0b95265f1`
      Authorization: `token ${accessToken}`
    }
  })

  console.log(`result: `, result.data)

  return result.data
}

async function success (idKey: string, req: any, res: any, userInfo: any) {
  console.log('success! githubId:', userInfo.id)

  const user = await User.findOneAndUpdate({[idKey]: userInfo.id}, {
    name: userInfo.name,
    avatar: userInfo.avatar
  }, { lean: { virtuals: true } }, () => {})

  console.log('success find user, user._id:', user && user._id)

  // 如果用户存在则直接登录，否则创建用户后登录
  if (user) {
    login(req, user)
  } else {
    const userDoc = new User({
      [idKey]: userInfo.id,
      username: shortid.generate(),
      password: shortid.generate(),
      name: userInfo.name,
      avatar: userInfo.avatar,
    })

    await userDoc.save()

    login(req, userDoc)
  }

  res.cookie('ROLE', user.role)
  res.redirect(req.cookies.oauth_redirect || '/')
}

function failure (err: Error, req: any, res: any) {
  console.log('error:', err.message)
  res.send('授权失败，请重试')
  throw err
}

function login (req: any, user: any) {
  const { _id, username, name, avatar, created, role, githubId } = user
  const sessionUser = {
    id: _id, username, name, avatar, created, role, githubId
  }
  console.log('session user', req.session)
  req.session.user = sessionUser
  console.log('login success')
}

// 49ca725d22e4eabd3f1944da3d7c95e0b95265f1
// const userInfo = { login: 'ffx0s',
//   id: 13212645,
//   node_id: 'MDQ6VXNlcjEzMjEyNjQ1',
//   avatar_url: 'https://avatars1.githubusercontent.com/u/13212645?v=4',
//   gravatar_id: '',
//   url: 'https://api.github.com/users/ffx0s',
//   html_url: 'https://github.com/ffx0s',
//   followers_url: 'https://api.github.com/users/ffx0s/followers',
//   following_url: 'https://api.github.com/users/ffx0s/following{/other_user}',
//   gists_url: 'https://api.github.com/users/ffx0s/gists{/gist_id}',
//   starred_url: 'https://api.github.com/users/ffx0s/starred{/owner}{/repo}',
//   subscriptions_url: 'https://api.github.com/users/ffx0s/subscriptions',
//   organizations_url: 'https://api.github.com/users/ffx0s/orgs',
//   repos_url: 'https://api.github.com/users/ffx0s/repos',
//   events_url: 'https://api.github.com/users/ffx0s/events{/privacy}',
//   received_events_url: 'https://api.github.com/users/ffx0s/received_events',
//   type: 'User',
//   site_admin: false,
//   name: null,
//   company: null,
//   blog: 'https://webfed.cn',
//   location: null,
//   email: null,
//   hireable: null,
//   bio: null,
//   public_repos: 16,
//   public_gists: 0,
//   followers: 4,
//   following: 5,
//   created_at: '2015-07-07T04:02:03Z',
//   updated_at: '2019-12-15T11:46:43Z' }

export function createOauthRoute (app) {
  app.get('/oauth/redirect', oauth)
}
