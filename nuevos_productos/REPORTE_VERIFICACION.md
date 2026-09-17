# Reporte de verificación — nuevos_productos (54 productos)

Fecha: verificación cruzando 4 fuentes por producto (carpeta · imagen · insert.sql · site.txt/URL).

## Estrategia usada
1. **Estructural (automático):** cada carpeta = 1 imagen + insert.sql + site.txt con URL; el `img` del SQL existe; nombre de carpeta ≈ `name` del SQL.
2. **Semántico (URL como fuente de verdad):** clasificar cada URL por marca/host y tipo de página (oficial vs distribuidor vs página equivocada).
3. **Specs:** marcar productos sin dimensiones/peso/stack para completar desde la ficha.

## Limpieza aplicada
- Movidas a `_a_borrar/`: carpetas vacías `FULLROM-FROG-PUMP` y `FULLROM-UTILITY-BENCH` (duplicadas de "FULL ROM Frog Pump" / "FULL ROM Utility Bench").
- Movidas a `_a_borrar/schwinn_extra/`: 2 imágenes `.webp` sobrantes del Schwinn.

## Correcciones de URL ya aplicadas
- **Nautilus Nitro Plus Seated Leg Curl**: manual (manualzz) → ficha de distribuidor (globalfitness.com). ✅
- **Schwinn AC Performance Plus**: blog de review → ficha de distribuidor (acefitnessequipment.com). ✅

## 🔴 URLs INCORRECTAS pendientes de arreglar (7)
| Producto | URL actual (mala) | Problema |
|---|---|---|
| FULL ROM Dual Adjustable Pulley | commercial.torquefitness.com | Otra marca (Torque) |
| FULL ROM Linear Leg Press | lifefitness.com/...linear-leg-press | Otra marca (Life Fitness) |
| FULL ROM Olympic Flat Bench | freemotionfitness.com/...olympic-flat-bench | Otra marca (Freemotion) |
| FULL ROM RG1071 Half Rack | lelunetiermilano.com/...rigards-rg1071 | ¡Gafas! (coincidió por "RG1071") |
| FULL ROM V-Squat | barbellmedicine.com/blog/... | Blog, no producto |
| Freemotion Genesis Quad | manualzz.com/doc/... | Manual, no ficha |
| Matrix Trotadora (Planet Fitness) | matrixhomefitness.com/collections/treadmills | Categoría + línea home (no comercial). Modelo sin confirmar |

Nota: los ítems FULL ROM correctos sí usan `fullrom.com/products/...`. Los de arriba hay que buscar su slug real en fullrom.com o confirmar la marca real (FULL ROM podría ser línea de American Strength).

## 🟡 URLs A REVISAR (distribuidor/usado o por confirmar) (11)
Cybex Jungle 4-Stack (fitnessplus), Cybex VR3 Abdominal (gymstore), Cybex VR3 Seated Leg Curl (gymstore), FULL ROM RG1038 Multi AB Bench (americanstrength), Freemotion Genesis Overhead Tricep (apexgym), Freemotion LiveAxis F703 (s-six), Insight Fitness Leg Curl (prosportskw), Matrix E5x (cffstrength), Precor 240i (fitnesszone), Precor Spinner Chrono (progymsupply).

## 🟢 URLs OK (oficiales del fabricante) (~34)
Todas las Hammer Strength (lifefitness), Life Fitness (6), Precor TRM 885 (precor.com), Matrix Aura G3-S71/G3-S72 y Matrix Versa (matrixfitness), Freemotion EPIC Calf/Smith y Genesis Abdominal/Shoulder (freemotionfitness), Power Lift (poweliftusa), Tomahawk IC7 (teamicg), FULL ROM en fullrom.com (Belt Squat, Frog Pump, RG1037, RG1041, RG2049, RG5008, Sissy Squat, Utility Bench), Insight Leg Extension (insightfits).

## ⚠️ Productos SIN specs (dims/peso/stack vacíos) — completar desde la ficha (~22)
Cybex VR3 Seated Leg Curl; FULL ROM Belt Squat, Dual Adjustable Pulley, Linear Leg Press, Olympic Flat Bench, RG1071, Sissy Squat, Utility Bench, V-Squat; Freemotion Genesis (Abdominal, Multi-Plane Shoulder, Overhead Tricep, Quad), LiveAxis F703; Insight (Leg Curl, Leg Extension); Matrix Versa (los 8: VS-S53, VS-S40, VS-S13, VS-S33, VS-S71, VS-S70, VS-S23, VS-S42); Matrix Trotadora PF; Matrix Aura Seated Leg Curl (falta nw).

## 🧩 Inconsistencia menor
- Las 8 Matrix Versa tienen `series = 'Matrix'`; el resto de Matrix usa `series = 'Matrix Fitness'`. Normalizar a **'Matrix Fitness'**.

## Plan sugerido para "corregir todo" (por lotes)
- **Lote A (rápido, alto valor):** completar specs de las 8 Matrix Versa desde sus fichas oficiales (URLs ya correctas) + normalizar serie.
- **Lote B:** completar specs de Life Fitness/Freemotion/Precor con URL oficial.
- **Lote C:** resolver las 7 URLs 🔴 (buscar ficha correcta; para FULL ROM confirmar marca/slug).
- **Lote D:** confirmar imágenes vs producto (montajes) y reemplazar las que no correspondan.
- **Pendiente:** modelo real de la trotadora Matrix Planet Fitness (etiqueta del chasis).
