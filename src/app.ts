import express from 'express';
import { isNull, isNullOrUndefined } from 'util';

class App {
  public express

  constructor() {
    this.express = express()
    this.express.set('view engine', 'ejs')
    this.mountRoutes()
  }

  private mountRoutes(): void {
    const router = express.Router()
    router.get('/record', (req, res) => {
      res.render('record');
    });
    router.get('/', (req, res) => {
      const styles = [
        { name: 'Basic', id: 'Basic' },
        { name: 'Melody', id: 'Melody' },
        { name: 'Chords', id: 'Chords' },
      ];
      res.render('index', { styles: styles })
    })
    this.express.use(router)
    this.express.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      next();
    });
    this.express.use(express.static('static'))
  }
}

export default new App().express
