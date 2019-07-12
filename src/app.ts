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
        { name: 'Basic', id: 'Basic' },
        { name: 'Melody', id: 'Melody' },
        { name: 'Drum Kit', id: 'DrumKit' },
        { name: 'Chords', id: 'Chords' },
      ];
      res.render('index', { styles: styles })
    })
    this.express.use('/', router)
    this.express.use(express.static('static'))
  }
}

export default new App().express
