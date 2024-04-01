import "./style.css"
import { getWeather } from "./weather"

 getWeather(10,10, Intl.DateTimeFormat().resolvedOptions().timeZone)


 //how to get your local timezone
console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)
console.log(document.querySelector('[data-template-high]'))

