import express from 'express'

const routes = (Models) => {
    console.log(Models)
    const router = express.Router()

    router.get('/', (req, res) => {
        const query = {}
        const sort = {}
        let limit = 20
        if (req.query.limit) {
            limit = req.query.limit
        } 
        if (req.query.sale === 'true') {
            query.forSale = true
            sort.currentPrice = 1
        }
        if (req.query.isPrime === 'true') {
            query.isPrime = true
            sort.currentPrice = 1
        }
        if (req.query.tokenId) {
            query.tokenId = parseInt(req.query.tokenId, 10)
        }
        console.log('me?')
        Models.NFT.find(query, '-_id -__v').sort(sort).limit(limit).then(data => {
            Models.NFT.find(query, '-_id -__v').countDocuments().then(total => {
                res.status(200).send({ data, total })
            })
        })
        .catch(err => console.log(err))
    })
    return router
}


export default routes