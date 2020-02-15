import { UserInputError } from 'apollo-server'

export function validateSync (doc: any) {
  const error = doc.validateSync()

  if (error) {
    const messages = Object.keys(error.errors).map(field => {
      return error.errors[field].message
    })
    return new UserInputError(messages[0])
  }
}

export const uniqueError = function (error: any, message: string) {
  if (error.name === 'MongoError' && error.code === 11000) {
    return new UserInputError(message)
  } else {
    return error
  }
}
