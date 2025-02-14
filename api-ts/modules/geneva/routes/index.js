
import auth from './auth'
import cms from './cms'
import contact from './contact'

const routes = (app, urlPrepend, Models) => {
    const url = urlPrepend ? `/${urlPrepend}/` : `/`
    app.use(`${url}auth`, auth(Models))
    app.use(`${url}cms`,cms(Models))
    app.use(`${url}contact`, contact())
}

export default routes