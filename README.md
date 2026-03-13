Este proyecto es un sistema de reservas en una oficina de coworking en el cual hay control de usuarios por roles y tokens, registro de asistencias con carné y escaner en la oficina, control y gestión de los
usuarios mediante vistas, perfiles de los usuarios, sistema de correos mediante SES y ROLEIAM, variables de entorno, los backends y frontend estan hechos en JavaScript, el frontend especificamente en REACT,
la base de datos es en postgreSQL, este proyecto es compatible con despliegue en la nube de AWS EC2 mediante dockers., este proyecto esta en arquitectura MVC a excepción de la automatizacion_eventos que esta
en arquitectura hexagonal.


controller assistent frontend


Este frontend esta hecho en REACT, es quien conecta el controller assistent backend para que el usuario interactue con este, esta adaptado para generar un docker y ser desplegado en AWS.


¿Que debo instalar?
Para correr este proyecto necesitas instalar NODE.js y abrir una terminal y ubicarte en la carpeta de controller-assistent-frontend y correr npm i para instalar todas las dependencias necesarias, también 
definir las variables de entorno necesarias para su funcionamiento


¿Como lo corro?
Para correr el frontend debes correr en la terminal ubicado en controller-assistent-frontend en comando npm run start


controller assistent backend


Este backend esta hecho en JavaScript, este backend es un API REST que conecta con la base de datos hecha en postgreSQL, esta adaptado para genrar docker y desplegar en AWS


¿Que debo instalar


Para correr este proyecto necesitas instalar NODE.js y abrir una terminal y ubicarte en la carpeta de controller-assistent-backend y correr npm i para instalar todas las dependencias necesarias, también 
definir las variables de entorno necesarias para su funcionamiento


¿Como lo corro?


Para correr el frontend debes correr en la terminal ubicado en controller-assistent-backend en comando npm run start


automatizacion eventos


Descripción


Este backend consiste en una API que conecta con un programa externo que registra y guarda las asistencias de los empleados a la oficina mediante el escaner de carnés y se comunica con la base de datos de RIO
para insertar las asistencias y salidas de los empleados


¿Que debo instalar?
Para correr este proyecto necesitas instalar NODE.js y abrir una terminal y ubicarte en la carpeta de automatizacion_eventos y correr npm i para instalar todas las dependencias necesarias, también 
definir las variables de entorno necesarias para su funcionamiento



¿Como lo corro?
Para correr el frontend debes correr en la terminal ubicado en automatizacion_eventos en comando npm run start


Para la base de datos es en PostgreSQL y es correr el script proporcionado
