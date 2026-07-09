# Once upon a time... the Night

An interactive data visualization exploring the relationship between **artificial light at night**, **economic development**, and **mental health** across 192 countries from 2013 to 2023.

Built for the Data Visualization Lab course at the University of Trento.

---

## What the project is

Light pollution is no longer just an astronomical nuisance — it is a public health concern. Epidemiological research increasingly links chronic exposure to artificial light at night to disrupted circadian rhythms, poor sleep, and higher rates of depression and anxiety. Yet the evidence at a global scale, spanning many countries and years, is hard to visualize. This project is an attempt to make it visible.

The core question is: *does the amount of artificial light a country produces correlate with the mental health of its population?* The economic dimension is inseparable from the answer — wealthier, more urbanized countries tend to be brighter, and they also tend to have better mental health reporting — so GDP and income levels are woven in throughout as essential context, not just a side note.

The visualization combines ten years of VIIRS nighttime satellite data with World Bank GDP figures and IHME mental health prevalence rates, then makes the patterns interactive so users can explore them country by country and year by year.

The interface is built around a **realistic 3D globe**. Clicking a country opens a set of analytical panels that trace how its light output, wealth, and health metrics evolved over the decade. A **timeline slider** lets you scrub through years and watch the globe re-color in real time. A **comparison mode** lets you pin two countries side by side across all charts. A dedicated **Interesting Results** section walks through the most striking patterns found in the data — from Sub-Saharan Africa's electrification surge to the anomaly of countries that got richer while getting darker, and the within-income-group signal that suggests light may play an independent role beyond wealth.

---

## Running it locally

### With Docker (recommended)

You only need [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed (no Node.js or npm required).

```bash
# Clone the repository
git clone <repo-url>
cd Light-Pollution

# Build the image and start the server
docker compose up --build
```

Open <http://localhost:8080> in your browser. To stop it, press `Ctrl+C`.

Subsequent runs (after the first build) can skip `--build` and start instantly:

```bash
docker compose up
```

### Without Docker

You need [Node.js](https://nodejs.org/) v18 or later.

```bash
# Clone the repository
git clone <repo-url>
cd Light-Pollution

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open <http://localhost:5173> in your browser.

> Earth textures (surface, specular, clouds) are fetched from jsDelivr on first load, so an internet connection is required. If a texture fails, the globe automatically falls back to a flat Blue Marble image.

To build for production:

```bash
npm run build
npm run preview   # serves the production build locally
```

---

## How to use it

**Exploring the globe**

- Use the **header toggles** to switch the globe's color encoding between radiance, GDP per capita, and mental health prevalence.
- Use the **timeline slider** at the bottom to change the active year (2013–2023), or press play to animate through the decade.
- Click any country to select it and open its data panels. Press **Escape** or click the background to deselect.

**Country panels**

When a country is selected, a tabbed panel appears on the right. Navigate between tabs with the arrows or by clicking the label.

| Tab | What it shows |
| --- | --- |
| **Wealth** | Radiance & GDP per capita over time (dual-axis) · Light-to-GDP efficiency ratio |
| **Health** | Year-over-year radiance & health trajectory · Global position scatter (all countries plotted) |
| **Energy & Urbanization** | Energy use per capita trend · Urban population share trend |
| **Income Groups** | Radiance and health prevalence distributed across the four World Bank income tiers |

On desktop, a **Radiance Growth** panel showing year-over-year change relative to the 2013 baseline is always pinned to the left of the globe.

**Comparison mode**

Once a country is selected, click **Compare** in the top bar to pick a second country. All charts update to overlay both countries on the same axes.

**Global Rankings**

With no country selected, click the **Rankings** tab in the center bar to open a sortable bar chart of all countries for any metric and year.

**Interesting Results**

Click **Interesting Results** in the header for a scrollable narrative that walks through the ten most notable patterns in the data, with mini-charts drawn directly from the dataset.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| UI framework | React 18 + Vite |
| 3D globe | Three.js — satellite texture, specular oceans, cloud layer, starfield |
| Charts | D3 v7 — all panel charts and choropleth color scales |
| Background animation | OGL — WebGL galaxy (dark mode) and dot field (light mode) |
| UI animation | Motion |
| Data pipeline | Python (separate — see below) |

---

## Data

The visualization merges three independent public datasets, all indexed by ISO country code and year (2013–2023).

### Sources

**NASA / NOAA VIIRS — nighttime radiance**

Satellite-derived mean nighttime radiance in nW/cm²/sr, from the VIIRS Day/Night Band. VNL V2.1 covers 2013–2021; VNL V2.2 covers 2022–2023. Raw rasters were processed through Google Earth Engine and aggregated to country level by zonal mean over each country's land area.

**World Bank — GDP per capita**

GDP per capita in current USD (indicator `NY.GDP.PCAP.CD`). Used both as a direct metric and to classify countries into four income tiers (Low, Lower-middle, Upper-middle, High) following the World Bank's own annual thresholds.

**IHME Global Burden of Disease — mental health prevalence**

Modelled prevalence of depressive and anxiety disorders per 100,000 population. These are estimates produced by a disease modelling framework, not surveillance counts.

### Coverage

After merging and harmonizing country names across all three sources, **189 countries** have at least one year of complete data. **161** of them are rendered as clickable polygons on the globe; the rest are microstates and territories below the geometry resolution threshold of the Natural Earth 110m dataset used for borders.

Two derived variables are computed during the pipeline:

- **Radiance growth index** — percentage change in mean radiance relative to each country's 2013 baseline, used to identify the fastest-brightening and fastest-dimming nations over the decade.
- **Light-to-GDP ratio** — mean radiance divided by GDP per capita (×10⁻⁴), a rough proxy for how much light a country emits per unit of economic output.

### A note on the health data

The IHME mental health figures should be treated as rough indicators rather than ground truth:

- **Reporting capacity varies widely.** Countries with stronger healthcare systems tend to record — and therefore appear to "have" — more diagnosed cases. Higher measured prevalence can reflect better detection, not worse underlying health.
- **Stigma and access distort the numbers.** In many regions, mental health conditions go undiagnosed due to cultural stigma, limited specialist access, or weak data infrastructure.
- **The link to light pollution is indirect.** Satellite radiance measures upward-emitted light from space, not personal exposure inside homes or bedrooms. The biological pathway (artificial light → circadian disruption → mental health) is plausible and actively studied, but the aggregate country-level correlations shown here cannot establish causation.

The goal of including health data is to surface a phenomenon that is otherwise invisible and prompt questions — not to assert that brighter skies cause higher rates of depression or anxiety.

### Regenerating the data assets

The `public/data/` files committed to this repository are ready to use as-is. To rebuild them from raw sources:

```bash
cd pipeline
python -m venv venv
source venv/bin/activate          # bash/zsh
# source venv/bin/activate.fish   # fish shell

pip install -r requirements.txt

# Place the raw CSVs in public/data/raw/
# (acquisition notes are at the top of each pipeline script)

python scripts/merge.py                   # clean and merge all three sources
python scripts/enrich_dataset.py          # compute derived variables
python scripts/build_frontend_data.py     # produce data_bundle.json, countries.geojson, and .bin point clouds
```

The binary `.bin` files are pre-triangulated point clouds used to render the per-year radiance maps on the globe surface; they are produced by `build_frontend_data.py`.
