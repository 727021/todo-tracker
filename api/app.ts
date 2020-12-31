import express, { NextFunction, Request, Response } from 'express'
import { urlencoded, json } from 'body-parser'
import morgan from 'morgan'
import mongoose from 'mongoose'
import helmet from 'helmet'
import bearer from 'express-bearer-token'
import { verify } from 'jsonwebtoken'
import { config } from 'dotenv'

import routes from './routes'

import User, { IUser } from './models/user'

config()

const PORT: number = Number(process.env.PORT) || 3000

export const app = express()

app.use(morgan('dev'))
    .use(helmet())
    .use(urlencoded({ extended: false }))
    .use(json())
    .use(bearer())
    .use((req: Request, res: Response, next: NextFunction) => {
        if (req.token) {
            verify(
                req.token,
                process.env.JWT_SECRET as string,
                (err, decoded) => {
                    if (err && err.name === 'TokenExpiredError') next()
                    else if (err) next(err)
                    else
                        User.findById((decoded as IUser)._id)
                            .then(user => {
                                if (user) req.user = user
                                next()
                            })
                            .catch(err => {
                                next(err)
                            })
                }
            )
        } else next()
    })
    .use(routes)

export default app

const db = (tries?: number, max?: number | null) => {
    if (!tries) tries = 1
    if (max && max < 1) max = null
    if (!max) max = Number(process.env.MAX_DB_TRIES) || 3

    mongoose
        .connect(process.env.MONGODB_URL as string, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            family: 4
        })
        .then(() => {
            console.log('Connected to database')
        })
        .catch(() => {
            console.log(
                `Database connection failed. Retrying... (${tries}/${max})`
            )
            if (max && Number(tries) < max) db(Number(tries) + 1, max)
            else process.exit()
        })
}
db()

if (process.env.SERVER_ONLY && +process.env.SERVER_ONLY === 1)
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`))