import axios from 'axios'
const { NOTIFY_URL, NOTIFY_TOKEN } = require('../config')

const headers = { 'content-type': 'application/json', 'Authorization': NOTIFY_TOKEN }

export function notify (title: string, content: string|string[][]) {
  if (!NOTIFY_URL) return

  let message = ''
  
  if (Array.isArray(content)) {
    message = content.map(row => {
      return row.join('\n') + '\n'
    }).join('\n')
  } else {
    message = content
  }

  const data = {title, text: `${message}` }
  
  axios.post(NOTIFY_URL, data, { headers })
}
