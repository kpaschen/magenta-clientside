import * as express from 'express';

class App {
  public express

  constructor() {
    this.express = express()
    this.express.set('view engine', 'ejs')
    this.mountRoutes()
  }

  private mountRoutes(): void {
    const router = express.Router()
    router.get('/', (req, res) => {
      const styles = [
        { name: 'melody', id: 'makeRnnMelody' },
        { name: 'drums', id: 'makeRnnDrums' },
        { chords: 'chords', id: 'makeRnnChords' },
      ];
      res.render('index', { styles: styles })
    })
    this.express.use('/', router)
    this.express.use(express.static('static'))
  }
}

export default new App().express
