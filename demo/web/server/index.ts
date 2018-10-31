import * as next from "next"
import * as express from "express"
import meanTimeBetweenBlocksHandler from "../api/meanTimeBetweenBlocks"

const expressApp = express()

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== "production"
const nextApp = next({ dev })

process.on("uncaughtException", err => {
  console.error("Caught exception:", err)
})

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at:", p, "reason:", reason)
})

nextApp
  .prepare()
  .then(() => {
    // Pages:
    expressApp.get("/", (req, res) => {
      console.log("get /")
      return nextApp.render(req, res, "/", req.params)
    })
    expressApp.get("/a", (req, res) =>
      nextApp.render(req, res, "/a", req.params)
    )
    expressApp.get("/b", (req, res) =>
      nextApp.render(req, res, "/b", req.params)
    )
    expressApp.get("/debug", (req, res) =>
      nextApp.render(req, res, "/debug", req.params)
    )
    expressApp.get("/meanTimeBetweenBlocks", (req, res) =>
      nextApp.render(req, res, "/meanTimeBetweenBlocks", req.params)
    )
    expressApp.get("/service-worker.js", (req, res) =>
      nextApp.render(req, res, "/service-worker.js", req.params)
    )

    // API:
    expressApp.get("/api/meanTimeBetweenBlocks", meanTimeBetweenBlocksHandler)

    // Let Next.js handle everything else:
    expressApp.all("*", (req, res) => {
      let nextRequestHandler = nextApp.getRequestHandler()
      return nextRequestHandler(req, res)
    })

    expressApp.listen(port, err => {
      if (err) throw err
      console.log(`> Ready on http://localhost:${port}`)
    })
  })
  .catch(err => {
    console.log("An error occurred, unable to start the server")
    console.log(err)
    process.exit(1)
  })
