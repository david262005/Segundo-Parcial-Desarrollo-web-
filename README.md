# SubastaAuto GT — Plataforma Web de Subastas de Vehículos en Tiempo Real (Caso Copart)

## 🔗 Sitio web publicado

### 👉 **https://subastaauto-gt.web.app** 👈

---

## 👤 Usuarios de prueba

Use estos usuarios en **navegadores distintos** (o una ventana normal y otra de incógnito) para hacer pruebas cruzadas de subasta en tiempo real.

| # | Nombre       | Correo                          | Contraseña      |
|---|--------------|---------------------------------|-----------------|
| 1 | Ana López    | `ana.lopez@subastaauto.gt`      | `Subasta#2026A` |
| 2 | Bruno Méndez | `bruno.mendez@subastaauto.gt`   | `Subasta#2026B` |
| 3 | Carla Ruiz   | `carla.ruiz@subastaauto.gt`     | `Subasta#2026C` |

**Prueba sugerida:** entre con Bruno en un navegador y con Carla en otro, abra el mismo vehículo (por ejemplo, *2019 Toyota Corolla LE*, publicado por Ana) y oferte en ambos. La oferta actual, el temporizador y los indicadores *"¡Vas ganando esta subasta!"* / *"Tu oferta ha sido superada"* cambian al instante, sin recargar la página (F5).

---

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend (SPA) | React 18 + Vite + React Router |
| Backend | Firebase: Authentication (correo/contraseña) y Realtime Database con **reglas de validación en el servidor** |
| Tiempo real | Suscripciones `onValue` de Firebase Realtime Database (WebSockets) |
| Hosting | Firebase Hosting |

## Funcionalidades según el enunciado

### A. Autenticación y gestión de usuarios
- Registro con **nombre, apellido, correo, teléfono y contraseña segura** (mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial, con medidor de seguridad).
- Un usuario **no autenticado solo ve el inventario en modo lectura**. Las rutas para publicar y editar están protegidas, y el panel de puja pide iniciar sesión.
- El servidor rechaza cualquier escritura de usuarios anónimos.

### B. Publicación de vehículos
- **Ficha técnica** obligatoria: año, tipo de artículo, marca, modelo, motor, transmisión, combustible, tren de manejo (AWD/FWD/RWD/4WD) y número de cilindros.
- **Estado de daño:** 🟢 Verde (menor/limpio) · 🟡 Amarillo (medio/reparable) · 🔴 Rojo (severo/salvamento).
- **Galería:** mínimo **5 fotografías** (máximo 10). Las fotos se comprimen automáticamente y se pueden reordenar o elegir como portada.
- **Parámetros de la subasta:** precio base, fecha y hora de inicio, fecha y hora de cierre.
- **Mis publicaciones:** el publicador busca y **edita** sus vehículos. Si el vehículo ya tiene pujas, no se puede modificar el precio base ni las fechas.

### C. Home e inventario dinámico
- Tarjetas con portada, estado de la subasta, color de daño, oferta actual y temporizador en vivo.
- **Filtros múltiples:** búsqueda de texto, estado de la subasta, nivel de daño (Verde/Amarillo/Rojo), tipo, marca, modelo, rango de años, transmisión, combustible, tren de manejo, cilindros y precio máximo. También permite ordenar los resultados.
- Paleta de colores clara.

### D. Detalle y motor de subastas (tiempo real)
- Ficha técnica completa y **carrusel interactivo** (flechas, miniaturas, puntos, teclado, deslizamiento táctil y pantalla completa).
- **Reglas de puja validadas en el servidor** (`database.rules.json`):
  - La oferta debe ser **≥ precio base**.
  - La oferta debe ser **mayor que la oferta actual en al menos un 10 %**.
  - Solo se aceptan ofertas **entre la hora de inicio y la de cierre**, según la hora del servidor.
  - El dueño no puede ofertar en su propio vehículo.
  - Control de concurrencia: si dos usuarios ofertan al mismo tiempo, solo se acepta una de las ofertas.
- **Privacidad:** la oferta pública solo contiene `monto`, `fecha` y `cantidad`. El uid del ganador se guarda en `/ganadores`, que **nadie puede leer**. Cada usuario solo puede leer sus propias pujas (`/misPujas/{uid}`).
- **Tiempo real:** la oferta actual, el número de pujas, el temporizador (sincronizado con la hora del servidor) y los indicadores *Ganando* / *Superado* se actualizan sin F5. Además, se muestra una notificación emergente si otro usuario supera tu oferta, estés en la página que estés.
- **Cierre:** al terminar el tiempo se muestra **"Oferta cerrada"**. Si no hubo ninguna oferta que alcanzara el monto base, la subasta se declara **no vendida / desierta**.

## Estructura de datos (Realtime Database)

```
catalogs/                    catálogos (marcas, tipos, combustibles…)   lectura pública
users/{uid}                  perfil del usuario                         solo el dueño
vehicles/{vid}               ficha técnica + parámetros de subasta      lectura pública, escritura solo el dueño
fotos/{vid}                  galería (≥ 5 imágenes)                     lectura pública, escritura solo el dueño
ofertas/{vid}                { monto, fecha, cantidad }                 lectura pública (sin identidad)
ganadores/{vid}              uid del mejor postor                       sin lectura (privado)
misPujas/{uid}/{vid}         mi último monto ofertado                   solo el dueño
```

## Ejecución local y despliegue

1. Cree un proyecto en [Firebase Console](https://console.firebase.google.com) (plan gratuito Spark).
2. En **Authentication → Sign-in method**, habilite **Correo electrónico/contraseña**.
3. En **Realtime Database**, cree la base de datos.
4. En **Configuración del proyecto → Tus apps**, registre una app web y copie la configuración en un archivo `.env` (use `.env.example` como plantilla).
5. Coloque el ID del proyecto en `.firebaserc`.
6. Ejecute:

```bash
npm install
npx firebase-tools login
npx firebase-tools deploy --only database   # publica las reglas del servidor
npm run seed                                # crea los 3 usuarios, catálogos y vehículos de ejemplo
npm run fotos                               # coloca fotografías reales a los vehículos de ejemplo
npm run dev                                 # desarrollo local: http://localhost:5173
npm run deploy                              # compila y publica en Firebase Hosting
```

### Pruebas de las reglas del servidor

```bash
npm run test:rules
```

Este comando ejecuta 28 pruebas automáticas sobre el emulador de Firebase (requiere Java 11 o superior). Prueba, entre otras cosas, el bloqueo a usuarios anónimos, el precio base, el incremento del 10 %, los horarios de la subasta, la concurrencia y la privacidad del ofertante.

## Créditos de las fotografías

Las fotos de los vehículos de ejemplo provienen de [Wikimedia Commons](https://commons.wikimedia.org) y se usan bajo sus licencias libres (Creative Commons / dominio público). Los derechos pertenecen a sus respectivos autores.
