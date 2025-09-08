import { setWorldConstructor } from '@cucumber/cucumber'

class CustomWorld {
  responseText = ''
}

setWorldConstructor(CustomWorld)
