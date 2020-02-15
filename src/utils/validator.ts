const userNameRe = /^[a-zA-Z0-9_-]{4,16}$/

export function isUserName (userName: string) {
  return userNameRe.test(userName)
}
