# Métricas - Documentación del Administrador

Documento de referencia para entender y explicar cada métrica disponible en la sección **Métricas** del panel de administración.

---

## Filtros de Fecha

Todas las métricas se calculan dentro de un rango de fechas seleccionado:

- **7 días**: Desde hace 6 días hasta hoy (inclusive)
- **14 días**: Desde hace 13 días hasta hoy
- **30 días**: Desde hace 29 días hasta hoy
- **90 días**: Desde hace 89 días hasta hoy
- **Personalizado**: Rango definido manualmente con los calendarios

> **Nota**: La página carga por defecto los ultimos 30 dias.

---

## KPIs (Tarjetas Superiores)

### 1. Reservas
- **Que mide**: Cantidad total de reservas con estado `CONFIRMED` dentro del rango de fechas.
- **Como se calcula**: Suma de todos los bookings confirmados para todas las clases del gimnasio en el periodo seleccionado.
- **Para que sirve**: Saber el volumen total de actividad del gimnasio.

### 2. Ocupacion
- **Que mide**: Porcentaje promedio de llenado de las clases.
- **Como se calcula**:
  ```
  reservas confirmadas / capacidad total disponible * 100
  ```
  La capacidad total se calcula sumando la `maxCapacity` de cada clase activa multiplicada por cuantas veces esa clase ocurrio en el rango (segun su dia de la semana).
- **Color condicional**:
  - Naranja (`< 80%`): Ocupacion normal
  - Verde (`> 80%`): Alta ocupacion, posiblemente necesitas abrir mas clases o aumentar cupos

### 3. Cancelacion
- **Que mide**: Porcentaje de reservas canceladas sobre el total (confirmadas + canceladas).
- **Como se calcula**:
  ```
  canceladas / (confirmadas + canceladas) * 100
  ```
- **Color condicional**:
  - Gris (`< 15%`): Tasa saludable
  - Rojo (`> 15%`): Tasa preocupante, revisar politica de cancelacion o ventanas de horario

### 4. Alumnos Activos
- **Que mide**: Total de usuarios con rol `STUDENT` e `isActive = true` en el gimnasio.
- **Como se calcula**: Conteo directo de la tabla `users` filtrado por gym.
- **Para que sirve**: Tener la base total de clientes.

### 5. Retencion
- **Que mide**: Porcentaje de alumnos activos que **sí** tuvieron al menos una reserva confirmada en los ultimos 30 dias.
- **Como se calcula**:
  ```
  (alumnos activos - alumnos en riesgo) / alumnos activos * 100
  ```
- **Color condicional**:
  - Verde (`> 70%`): Buena retencion
  - Naranja (`< 70%`): Revisar engagement

### 6. En Riesgo
- **Que mide**: Cantidad de alumnos activos que **no** tienen ninguna reserva confirmada en los ultimos 30 dias.
- **Como se calcula**: Alumnos activos cuyo historial de bookings no tiene ninguna entrada `CONFIRMED` con `classDate >= hoy - 30 dias`.
- **Color condicional**:
  - Gris (`< 10`): Aceptable
  - Rojo (`> 10`): Necesitas una campaña de re-engagement

---

## Graficos

### Tendencia de Ocupacion (Grafico de Area)
- **Que muestra**: La evolucion diaria del porcentaje de ocupacion.
- **Eje Y**: Porcentaje de ocupacion (0% a 100%)
- **Eje X**: Dias del periodo (solo el numero del dia)
- **Para que sirve**:
  - Detectar picos y valles semanales
  - Ver si hay dias especificos con muy baja ocupacion
  - Identificar tendencias de crecimiento o caida

### Participacion por Genero (Grafico Circular)
- **Que muestra**: Distribucion de las reservas confirmadas segun el campo `gender` del usuario.
- **Valores posibles**:
  - `MALE` → Masculino
  - `FEMALE` → Femenino
  - `OTHER` → Otro
  - `PREFER_NOT_TO_SAY` → Prefiero no decir
  - `NULL` → No especificado
- **Para que sirve**:
  - Entender la composicion de genero de tu audiencia
  - Detectar si hay disciplinas con participacion desbalanceada
  - Tomar decisiones de marketing o comunicacion

### Por Disciplina (Barras Horizontales)
- **Que muestra**: Ranking de disciplinas ordenadas por porcentaje de ocupacion.
- **Como se calcula**:
  ```
  reservas confirmadas de esa disciplina / capacidad total de esa disciplina * 100
  ```
- **Para que sirve**:
  - Saber que disciplinas tienen mas demanda
  - Decidir si agregar mas horarios de una disciplina popular
  - Evaluar si una disciplina con baja ocupacion justifica su espacio

### Por Coach (Barras Horizontales)
- **Que muestra**: Ranking de coaches ordenados por porcentaje de ocupacion de sus clases.
- **Como se calcula**:
  ```
  reservas confirmadas en clases del coach / capacidad total de sus clases * 100
  ```
- **Para que sirve**:
  - Identificar coaches con mayor pull de alumnos
  - Evaluar rendimiento de coaches nuevos
  - Distribuir horarios pico entre los coaches mas efectivos

### Dias de la Semana (Barras Verticales)
- **Que muestra**: Ocupacion promedio por dia de la semana (Lunes a Domingo).
- **Como se calcula**: Promedio de ocupacion de todos los dias que fueron, por ejemplo, "Lunes" dentro del rango.
- **Para que sirve**:
  - Identificar los dias mas y menos concurridos
  - Decidir si abrir o cerrar clases en ciertos dias
  - Ajustar precios o promociones por dia debil

### Horarios Pico (Barras Verticales)
- **Que muestra**: Ocupacion promedio por franja horaria.
- **Eje X**: Horas del dia (ej: 07:00, 08:00, 18:00)
- **Como se calcula**: Agrupa las reservas segun la hora de inicio (`startTime`) de la clase.
- **Para que sirve**:
  - Saber que horarios estan saturados
  - Identificar huecos para abrir nuevas clases
  - Ajustar capacidad de coaches segun demanda horaria

### Clases Mas Concurridas (Ranking)
- **Que muestra**: Top 10 clases individuales con mayor ocupacion.
- **Datos por fila**:
  - Nombre de la disciplina
  - Horario y coach
  - Porcentaje de ocupacion
  - Reservas totales / Capacidad total
- **Para que sirve**:
  - Identificar las clases estrella
  - Replicar horarios exitosos
  - Detectar clases que consistentemente se llenan (para considerar aumentar cupo)

### Ocupacion por Horario y Disciplina (Heatmap)
- **Que muestra**: Matriz de calor que cruza franjas horarias (filas) contra disciplinas (columnas).
- **Datos por celda**:
  - Porcentaje de ocupacion de esa disciplina en ese horario
  - Cantidad de reservas confirmadas (numero inferior)
  - Color de la celda segun intensidad de ocupacion (escala de baja a alta)
- **Como se calcula**:
  ```
  reservas confirmadas de disciplina X en horario Y / capacidad total de disciplina X en horario Y * 100
  ```
- **Para que sirve**:
  - Saber que disciplinas funcionan en cada franja horaria
  - Detectar combinaciones horario+disciplina con baja demanda
  - Optimizar la grilla semanal moviendo disciplinas a horarios donde pegan mejor

### Ocupacion por Dia y Disciplina (Heatmap)
- **Que muestra**: Matriz de calor que cruza dias de la semana (filas) contra disciplinas (columnas).
- **Datos por celda**:
  - Porcentaje de ocupacion de esa disciplina en ese dia
  - Cantidad de reservas confirmadas
  - Color segun nivel de ocupacion
- **Como se calcula**:
  ```
  reservas confirmadas de disciplina X en dia Y / capacidad total de disciplina X en dia Y * 100
  ```
- **Para que sirve**:
  - Identificar que disciplinas "pegan" cada dia
  - Detectar dias donde una disciplina no tiene demanda
  - Decidir si eliminar o reemplazar disciplinas en dias debiles

### Ocupacion por Coach y Horario (Heatmap)
- **Que muestra**: Matriz de calor que cruza franjas horarias (filas) contra coaches (columnas).
- **Datos por celda**:
  - Porcentaje de ocupacion de las clases de ese coach en ese horario
  - Cantidad de reservas confirmadas
  - Color segun nivel de ocupacion
- **Como se calcula**:
  ```
  reservas confirmadas en clases del coach X en horario Y / capacidad total del coach X en horario Y * 100
  ```
- **Para que sirve**:
  - Ver que coach tiene mas demanda en cada franja
  - Distribuir coaches mas efectivos en horarios pico
  - Identificar horarios donde un coach especifico no atrae alumnos
  - Planificar la grilla de coaches de forma data-driven

### Distribucion por Edad (Barras Horizontales)
- **Que muestra**: Cantidad de alumnos activos agrupados por rango etario.
- **Rangos**:
  - `< 18`: Menores de edad
  - `18-24`: Jovenes adultos
  - `25-34`: Millennials (core tipico del CrossFit)
  - `35-44`: Adultos jovenes
  - `45-54`: Adultos medios
  - `55+`: Masters / Senior
  - `Sin especificar`: Alumnos sin fecha de nacimiento registrada
- **Como se calcula**: Se toma la `birthDate` de cada alumno activo y se calcula la edad actual. Luego se agrupa en los rangos definidos.
- **Para que sirve**:
  - Conocer la demografia del gimnasio
  - Ajustar la comunicacion y marketing al rango etario predominante
  - Detectar si hay rangos de edad sub-representados

### Participacion por Edad (Barras Horizontales)
- **Que muestra**: Cantidad de reservas confirmadas agrupadas por rango etario del alumno.
- **Como se calcula**: De cada reserva confirmada en el periodo, se toma la edad del alumno que reservo y se agrupa por rango.
- **Para que sirve**:
  - Saber que edades son las que mas entrenan
  - Comparar "base de alumnos" vs "participacion real": puede haber muchos alumnos de 25-34 pero los que mas reservan son los de 35-44
  - Disenar clases especificas para el rango etario mas activo

---

## Glosario de Terminos

| Termino | Definicion |
|---|---|
| **Reserva confirmada** | Booking con estado `CONFIRMED` |
| **Capacidad** | Valor de `maxCapacity` de la clase |
| **Ocupacion** | Reservas confirmadas dividido capacidad, expresado en % |
| **Alumno activo** | Usuario con `role = STUDENT` e `isActive = true` |
| **Alumno en riesgo** | Alumno activo sin reservas confirmadas en los ultimos 30 dias |
| **Retencion** | Porcentaje de alumnos activos que NO estan en riesgo |

---

## Modelos de Datos Involucrados

Las metricas consultan las siguientes tablas:

- `users` → Alumnos, coaches, datos de genero
- `gym_classes` → Clases programadas, horarios, capacidad, disciplina, coach
- `bookings` → Reservas con estado, fecha y usuario
- `disciplines` → Nombre y color de cada disciplina

---

## Calculo de Capacidad Total

La capacidad total es la sumatoria de `maxCapacity` de cada clase activa multiplicada por la cantidad de veces que esa clase ocurre dentro del rango de fechas.

**Ejemplo**:
- Clase "CrossFit Lunes 07:00" tiene `maxCapacity = 12`
- En un rango de 30 dias hay 4 lunes
- Capacidad aportada por esa clase = 12 × 4 = 48 cupos

Esto se repite para todas las clases activas del gimnasio.

---

*Documento generado para referencia del equipo administrativo.*
