import axios from 'axios'
const { CQ_ACCOUNT, CQ_API_URL, CQ_SEND_MESSAGE_TOKEN } = require('../config')

const headers = { 'content-type': 'application/json', 'Authorization': 'Bearer ' + CQ_SEND_MESSAGE_TOKEN }

export function notify (title: string, content: string|string[][]) {
  if (!CQ_ACCOUNT) return

  let message = ''
  
  if (Array.isArray(content)) {
    message = content.map(row => {
      return row.join('\n') + '\n'
    }).join('\n')
  } else {
    message = content
  }

  const data = {'user_id': CQ_ACCOUNT, 'message': `${title}\n\n${message}` }
  
  axios.post(CQ_API_URL + '/send_private_msg', data, { headers })
}
