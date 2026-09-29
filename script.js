// =========================================================
// QIT BATCH 9 — WEEKLY CONTROL CENTER + LIVE LEADERBOARD
// FINAL CONNECTED — 29 SEP 2026
// =========================================================
(() => {
  "use strict";

  const POINT_CHALLENGE_URL =
    "https://script.google.com/macros/s/AKfycbz1iKWHZPoQI9vif1Ab-zcX4locQfnaMw8xh-edsP7WnckNqeVpJNgn79cx98PqS1w/exec";

  // Refresh leaderboard otomatis setiap 3 menit
  const LEADERBOARD_REFRESH_MS = 3 * 60 * 1000;

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));


  // =========================================================
  // CURRENT WEEK OTOMATIS
  // =========================================================

  const getISOWeekInfo = (input = new Date()) => {

    const local =
      new Date(
        input.getFullYear(),
        input.getMonth(),
        input.getDate()
      );

    const day =
      local.getDay() || 7;

    const monday =
      new Date(local);

    monday.setDate(
      local.getDate() - day + 1
    );


    const thursday =
      new Date(monday);

    thursday.setDate(
      monday.getDate() + 3
    );


    const yearStart =
      new Date(
        thursday.getFullYear(),
        0,
        1
      );


    const week =
      Math.ceil(
        (
          (
            thursday -
            yearStart
          ) /
          86400000 +
          1
        ) /
        7
      );


    const sunday =
      new Date(monday);

    sunday.setDate(
      monday.getDate() + 6
    );


    return {
      week,
      monday,
      sunday
    };
  };


  const formatWeekRange = ({
    monday,
    sunday
  }) => {

    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MEI",
      "JUN",
      "JUL",
      "AGU",
      "SEP",
      "OCT",
      "NOV",
      "DES"
    ];


    const sameMonth =
      monday.getMonth() ===
      sunday.getMonth();


    const sameYear =
      monday.getFullYear() ===
      sunday.getFullYear();


    if (
      sameMonth &&
      sameYear
    ) {

      return `${monday.getDate()}–${sunday.getDate()} ${months[monday.getMonth()]} ${sunday.getFullYear()}`;
    }


    if (sameYear) {

      return `${monday.getDate()} ${months[monday.getMonth()]} – ${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`;
    }


    return `${monday.getDate()} ${months[monday.getMonth()]} ${monday.getFullYear()} – ${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`;
  };


  const initCurrentWeek = () => {

    const info =
      getISOWeekInfo(
        new Date()
      );


    const title =
      `WEEK ${info.week}`;


    const short =
      `W${info.week}`;


    const badge =
      qs("#currentWeekBadge");

    const heading =
      qs("#currentWeekTitle");

    const orbit =
      qs("#orbitWeek");

    const range =
      qs("#currentWeekRange");


    if (badge) {
      badge.textContent =
        title;
    }


    if (heading) {
      heading.textContent =
        title;
    }


    if (orbit) {
      orbit.textContent =
        short;
    }


    if (range) {
      range.textContent =
        formatWeekRange(info);
    }
  };


  // =========================================================
  // JSONP
  // Untuk koneksi GitHub Pages -> Google Apps Script
  // =========================================================

  const jsonp = (
    url,
    params = {},
    timeout = 15000
  ) => {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        const cb =
          `__qitCb_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;


        const script =
          document.createElement(
            "script"
          );


        let timer;


        const cleanup = () => {

          clearTimeout(
            timer
          );

          try {

            delete window[cb];

          } catch (_) {

            window[cb] =
              undefined;
          }


          script.remove();
        };


        window[cb] =
          payload => {

            cleanup();

            resolve(
              payload
            );
          };


        timer =
          setTimeout(
            () => {

              cleanup();

              reject(
                new Error(
                  "Timeout saat mengambil data."
                )
              );

            },
            timeout
          );


        const query =
          new URLSearchParams({
            ...params,
            callback: cb,
            _: Date.now()
              .toString()
          });


        script.src =
          `${url}${url.includes("?") ? "&" : "?"}${query.toString()}`;


        script.onerror =
          () => {

            cleanup();

            reject(
              new Error(
                "Gagal terhubung ke sumber data."
              )
            );
          };


        document.head
          .appendChild(
            script
          );

      }
    );
  };


  // =========================================================
  // LEADERBOARD
  // =========================================================

  let leaderboardChart =
    null;


  const compactTeamName =
    name => {

      return String(
        name || ""
      )
        .replace(
          /\s+/g,
          " "
        )
        .trim();
    };


  // =========================================================
  // TOP 3 PODIUM
  // =========================================================

  const buildPodium =
    rows => {

      const wrap =
        qs(
          "#leaderboardPodium"
        );


      if (!wrap) {
        return;
      }


      const order = [

        {
          idx: 1,
          rank: 2,
          cls: "rank-2",
          icon: "fa-medal"
        },

        {
          idx: 0,
          rank: 1,
          cls: "rank-1",
          icon: "fa-crown"
        },

        {
          idx: 2,
          rank: 3,
          cls: "rank-3",
          icon: "fa-medal"
        }

      ];


      wrap.innerHTML =
        order
          .map(
            item => {

              const row =
                rows[
                  item.idx
                ];


              const team =
                row
                  ? compactTeamName(
                      row.team
                    )
                  : "—";


              const points =
                row
                  ? Number(
                      row.points ||
                      0
                    ).toLocaleString(
                      "id-ID"
                    )
                  : "—";


              const stream =
                row
                  ? row.stream || "-"
                  : "-";


              const lokasi =
                row
                  ? row.lokasi || "-"
                  : "-";


              return `
                <article class="podium-card ${item.cls}">

                  <span class="podium-rank">
                    ${item.rank}
                  </span>

                  <div class="podium-medal">
                    <i class="fa-solid ${item.icon}"></i>
                  </div>

                  <b
                    title="${team.replace(/"/g, "&quot;")}"
                  >
                    ${team}
                  </b>

                  <small class="podium-meta">
                    ${stream} • ${lokasi}
                  </small>

                  <strong>
                    ${points}
                    <small>PTS</small>
                  </strong>

                </article>
              `;
            }
          )
          .join("");
    };


  // =========================================================
  // WARNA GLOSSY CHART
  // =========================================================

  const createBarGradient =
    (
      ctx,
      chartArea,
      rank
    ) => {

      if (!chartArea) {

        return rank === 0
          ? "#0da7ee"
          : "#3177ea";
      }


      const gradient =
        ctx.createLinearGradient(
          chartArea.left,
          0,
          chartArea.right,
          0
        );


      // Juara 1
      if (rank === 0) {

        gradient.addColorStop(
          0,
          "#ffd454"
        );

        gradient.addColorStop(
          0.45,
          "#ffae35"
        );

        gradient.addColorStop(
          1,
          "#fff0a1"
        );


      // Juara 2
      } else if (
        rank === 1
      ) {

        gradient.addColorStop(
          0,
          "#9ed8ff"
        );

        gradient.addColorStop(
          0.55,
          "#5aa9ea"
        );

        gradient.addColorStop(
          1,
          "#dff3ff"
        );


      // Juara 3
      } else if (
        rank === 2
      ) {

        gradient.addColorStop(
          0,
          "#e5a96b"
        );

        gradient.addColorStop(
          0.55,
          "#bd7642"
        );

        gradient.addColorStop(
          1,
          "#ffd0a4"
        );


      // Ranking lainnya
      } else {

        gradient.addColorStop(
          0,
          "#0569d8"
        );

        gradient.addColorStop(
          0.48,
          "#11b9e7"
        );

        gradient.addColorStop(
          1,
          "#6978ee"
        );
      }


      return gradient;
    };


  // =========================================================
  // CHART TOP 15
  // =========================================================

  const renderLeaderboardChart =
    rows => {

      const canvas =
        qs(
          "#leaderboardChart"
        );


      if (
        !canvas ||
        typeof window.Chart !==
          "function"
      ) {

        return;
      }


      const labels =
        rows.map(
          row =>
            compactTeamName(
              row.team
            )
        );


      const values =
        rows.map(
          row =>
            Number(
              row.points ||
              0
            )
        );


      if (
        leaderboardChart
      ) {

        leaderboardChart
          .destroy();
      }


      leaderboardChart =
        new Chart(
          canvas,
          {

            type:
              "bar",


            data: {

              labels,

              datasets: [

                {

                  label:
                    "Point",

                  data:
                    values,

                  borderWidth:
                    1,

                  borderColor:
                    "rgba(255,255,255,.75)",

                  borderRadius:
                    10,

                  borderSkipped:
                    false,


                  backgroundColor:
                    context => {

                      const {
                        ctx,
                        chartArea
                      } =
                        context.chart;


                      return createBarGradient(
                        ctx,
                        chartArea,
                        context.dataIndex
                      );
                    },


                  hoverBorderWidth:
                    2,


                  hoverBorderColor:
                    "#ffffff"
                }
              ]
            },


            options: {

              indexAxis:
                "y",


              responsive:
                true,


              maintainAspectRatio:
                false,


              animation: {

                duration:
                  900,

                easing:
                  "easeOutQuart"
              },


              interaction: {

                intersect:
                  false,

                mode:
                  "nearest",

                axis:
                  "y"
              },


              plugins: {

                legend: {
                  display:
                    false
                },


                tooltip: {

                  displayColors:
                    false,

                  backgroundColor:
                    "rgba(5,31,66,.96)",

                  titleColor:
                    "#fff",

                  bodyColor:
                    "#dff7ff",

                  padding:
                    12,

                  cornerRadius:
                    10,


                  callbacks: {

                    title:
                      items =>
                        items[0]
                          ?.label ||
                        "",


                    label:
                      item =>
                        ` ${Number(
                          item.raw ||
                          0
                        ).toLocaleString(
                          "id-ID"
                        )} poin`
                  }
                }
              },


              scales: {

                x: {

                  beginAtZero:
                    true,


                  grid: {

                    color:
                      "rgba(66,142,203,.12)",

                    drawBorder:
                      false
                  },


                  border: {
                    display:
                      false
                  },


                  ticks: {

                    color:
                      "#6f8fac",

                    font: {

                      family:
                        "Poppins",

                      size:
                        11,

                      weight:
                        "600"
                    },

                    precision:
                      0
                  }
                },


                y: {

                  grid: {
                    display:
                      false
                  },


                  border: {
                    display:
                      false
                  },


                  ticks: {

                    color:
                      "#17416d",

                    autoSkip:
                      false,


                    font: {

                      family:
                        "Poppins",

                      size:
                        11,

                      weight:
                        "700"
                    },


                    callback:
                      function (
                        value
                      ) {

                        const text =
                          this.getLabelForValue(
                            value
                          );


                        return text.length >
                          28
                          ? text.slice(
                              0,
                              26
                            ) +
                              "…"
                          : text;
                      }
                  }
                }
              }
            },


            // Efek glossy
            plugins: [

              {

                id:
                  "gloss",


                afterDatasetsDraw(
                  chart
                ) {

                  const meta =
                    chart.getDatasetMeta(
                      0
                    );


                  const ctx =
                    chart.ctx;


                  ctx.save();


                  meta.data
                    .forEach(
                      bar => {

                        const p =
                          bar.getProps(
                            [
                              "x",
                              "y",
                              "base",
                              "height"
                            ],
                            true
                          );


                        const left =
                          Math.min(
                            p.base,
                            p.x
                          );


                        const width =
                          Math.abs(
                            p.x -
                              p.base
                          );


                        if (
                          width <
                          8
                        ) {

                          return;
                        }


                        const shine =
                          ctx.createLinearGradient(
                            left,
                            0,
                            left +
                              width,
                            0
                          );


                        shine.addColorStop(
                          0,
                          "rgba(255,255,255,.02)"
                        );


                        shine.addColorStop(
                          0.45,
                          "rgba(255,255,255,.18)"
                        );


                        shine.addColorStop(
                          0.58,
                          "rgba(255,255,255,.04)"
                        );


                        shine.addColorStop(
                          1,
                          "rgba(255,255,255,0)"
                        );


                        ctx.fillStyle =
                          shine;


                        ctx.fillRect(
                          left,
                          p.y -
                            p.height /
                              2 +
                            2,
                          width,
                          Math.max(
                            3,
                            p.height *
                              0.36
                          )
                        );
                      }
                    );


                  ctx.restore();
                }
              }
            ]
          }
        );
    };


  // =========================================================
  // STATUS LEADERBOARD
  // =========================================================

  const setLeaderboardState =
    (
      text,
      error = false
    ) => {

      const status =
        qs(
          "#leaderboardStatus"
        );


      if (!status) {
        return;
      }


      status.classList
        .toggle(
          "is-error",
          error
        );


      status.innerHTML =
        error

          ? `
            <i class="fa-solid fa-triangle-exclamation"></i>
            ${text}
          `

          : `
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            ${text}
          `;


      status.hidden =
        false;
    };


  // =========================================================
  // LOAD LEADERBOARD DARI APPS SCRIPT
  // =========================================================

  const loadLeaderboard =
    async () => {

      const refresh =
        qs(
          "#leaderboardRefresh"
        );


      const updated =
        qs(
          "#leaderboardUpdated"
        );


      refresh
        ?.classList
        .add(
          "is-loading"
        );


      setLeaderboardState(
        "Mengambil data leaderboard..."
      );


      try {

        // =====================================================
        // ENDPOINT AKTIF
        // /exec?api=leaderboard
        // =====================================================

        const data =
          await jsonp(
            POINT_CHALLENGE_URL,
            {
              api:
                "leaderboard"
            }
          );


        // =====================================================
        // VALIDASI RESPONSE
        // =====================================================

        if (
          !data ||
          data.success ===
            false
        ) {

          throw new Error(
            data?.error ||
            "Data tidak tersedia."
          );
        }


        // =====================================================
        // KONVERSI DATA APPS SCRIPT
        // namaTim -> team
        // totalPoin -> points
        // =====================================================

        const rows =
          Array.isArray(
            data.top15
          )

            ? data.top15
                .slice(
                  0,
                  15
                )
                .map(
                  team => ({

                    team:
                      team.namaTim ||
                      "Tanpa Nama",


                    points:
                      Number(
                        team.totalPoin
                      ) ||
                      0,


                    lokasi:
                      team.lokasi ||
                      "-",


                    stream:
                      team.stream ||
                      "-"
                  })
                )

            : [];


        if (
          !rows.length
        ) {

          throw new Error(
            "Data leaderboard kosong."
          );
        }


        // =====================================================
        // RENDER TOP 3
        // =====================================================

        buildPodium(
          rows
        );


        // =====================================================
        // RENDER TOP 15
        // =====================================================

        renderLeaderboardChart(
          rows
        );


        // Hilangkan loading
        const status =
          qs(
            "#leaderboardStatus"
          );


        if (status) {

          status.hidden =
            true;
        }


        // =====================================================
        // LAST UPDATE
        // =====================================================

        if (updated) {

          const serverTime =
            data.updatedAt ||
            new Date()
              .toLocaleString(
                "id-ID"
              );


          updated.innerHTML =
            `
              <i class="fa-regular fa-clock"></i>
              Update: ${serverTime}
            `;
        }


      } catch (err) {

        console.error(
          "QIT Leaderboard Error:",
          err
        );


        setLeaderboardState(
          `Gagal mengambil live leaderboard. (${err.message})`,
          true
        );


      } finally {

        refresh
          ?.classList
          .remove(
            "is-loading"
          );
      }
    };


  // =========================================================
  // INIT LEADERBOARD
  // =========================================================

  const initLeaderboard =
    () => {

      // Tombol refresh
      qs(
        "#leaderboardRefresh"
      )
        ?.addEventListener(
          "click",
          loadLeaderboard
        );


      // Tombol buka dashboard penuh
      qs(
        ".leaderboard-open"
      )
        ?.addEventListener(
          "click",
          () => {

            window.open(
              POINT_CHALLENGE_URL,
              "_blank",
              "noopener,noreferrer"
            );
          }
        );


      // Load pertama
      loadLeaderboard();


      // Refresh otomatis
      window.setInterval(
        loadLeaderboard,
        LEADERBOARD_REFRESH_MS
      );
    };


  // =========================================================
  // START
  // =========================================================

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      initCurrentWeek();

      initLeaderboard();
    }
  );

})();



// =========================================================
// QIT BATCH 9
// MULTI PNG POPUP CAROUSEL
// GOOGLE DRIVE READY
// =========================================================

(() => {

  "use strict";


  const POINT_CHALLENGE_URL =
    "https://script.google.com/macros/s/AKfycbz1iKWHZPoQI9vif1Ab-zcX4locQfnaMw8xh-edsP7WnckNqeVpJNgn79cx98PqS1w/exec";


  const AUTO_MS =
    6500;


  const qs =
    (
      s,
      r = document
    ) =>
      r.querySelector(
        s
      );


  // =========================================================
  // JSONP POPUP
  // =========================================================

  const jsonp =
    (
      url,
      params = {},
      timeout = 12000
    ) => {

      return new Promise(
        (
          resolve,
          reject
        ) => {

          const cb =
            `__qitPopup_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2)}`;


          const script =
            document.createElement(
              "script"
            );


          let timer;


          const cleanup =
            () => {

              clearTimeout(
                timer
              );


              try {

                delete window[
                  cb
                ];

              } catch (_) {

                window[
                  cb
                ] =
                  undefined;
              }


              script.remove();
            };


          window[
            cb
          ] =
            payload => {

              cleanup();

              resolve(
                payload
              );
            };


          timer =
            setTimeout(
              () => {

                cleanup();

                reject(
                  new Error(
                    "Timeout popup"
                  )
                );

              },
              timeout
            );


          const query =
            new URLSearchParams(
              {
                ...params,
                callback:
                  cb,
                _:
                  String(
                    Date.now()
                  )
              }
            );


          script.src =
            `${url}${url.includes("?") ? "&" : "?"}${query.toString()}`;


          script.onerror =
            () => {

              cleanup();

              reject(
                new Error(
                  "Popup source unavailable"
                )
              );
            };


          document.head
            .appendChild(
              script
            );
        }
      );
    };


  // =========================================================
  // INIT POPUP CAROUSEL
  // =========================================================

  const initPopupCarousel =
    async () => {

      const image =
        qs(
          "#campaignPoster"
        );


      const dots =
        qs(
          "#popupDots"
        );


      const prev =
        qs(
          "#popupPrev"
        );


      const next =
        qs(
          "#popupNext"
        );


      const loading =
        qs(
          "#posterLoading"
        );


      const fallback =
        qs(
          "#posterFallback"
        );


      const carousel =
        qs(
          "#popupCarousel"
        );


      if (
        !image ||
        !dots ||
        !carousel
      ) {

        return;
      }


      let items =
        [];


      let index =
        0;


      let timer =
        null;


      let touchStartX =
        0;


      // =====================================================
      // DOT INDICATOR
      // =====================================================

      const renderDots =
        () => {

          dots.innerHTML =
            items
              .map(
                (
                  _,
                  i
                ) => {

                  return `
                    <button
                      type="button"
                      class="popup-dot${i === index ? " active" : ""}"
                      data-popup-index="${i}"
                      aria-label="Poster ${i + 1}"
                    ></button>
                  `;
                }
              )
              .join("");


          dots.hidden =
            items.length <=
            1;


          prev
            ?.classList
            .toggle(
              "is-hidden",
              items.length <=
                1
            );


          next
            ?.classList
            .toggle(
              "is-hidden",
              items.length <=
                1
            );
        };


      // =====================================================
      // SHOW POSTER
      // =====================================================

      const show =
        i => {

          if (
            !items.length
          ) {

            return;
          }


          index =
            (
              i +
              items.length
            ) %
            items.length;


          const item =
            items[
              index
            ];


          image.classList
            .remove(
              "is-loaded"
            );


          image.alt =
            item.name

              ? `Poster QIT - ${item.name}`

              : `Poster QIT ${index + 1}`;


          let imageUrl =
            item.imageUrl ||
            "POPUP.png";


          image.src =
            `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(
              item.updated ||
              Date.now()
            )}`;


          requestAnimationFrame(
            () => {

              image.classList
                .add(
                  "is-loaded"
                );
            }
          );


          renderDots();
        };


      // =====================================================
      // AUTO SLIDE
      // =====================================================

      const restart =
        () => {

          clearInterval(
            timer
          );


          if (
            items.length >
            1
          ) {

            timer =
              setInterval(
                () => {

                  show(
                    index +
                    1
                  );

                },
                AUTO_MS
              );
          }
        };


      // =====================================================
      // BUTTON PREVIOUS
      // =====================================================

      prev
        ?.addEventListener(
          "click",
          () => {

            show(
              index -
              1
            );

            restart();
          }
        );


      // =====================================================
      // BUTTON NEXT
      // =====================================================

      next
        ?.addEventListener(
          "click",
          () => {

            show(
              index +
              1
            );

            restart();
          }
        );


      // =====================================================
      // DOT CLICK
      // =====================================================

      dots.addEventListener(
        "click",
        e => {

          const btn =
            e.target.closest(
              "[data-popup-index]"
            );


          if (!btn) {
            return;
          }


          show(
            Number(
              btn.dataset
                .popupIndex
            )
          );


          restart();
        }
      );


      // =====================================================
      // PAUSE HOVER
      // =====================================================

      carousel
        .addEventListener(
          "mouseenter",
          () =>
            clearInterval(
              timer
            )
        );


      carousel
        .addEventListener(
          "mouseleave",
          restart
        );


      // =====================================================
      // MOBILE SWIPE
      // =====================================================

      carousel
        .addEventListener(
          "touchstart",
          e => {

            touchStartX =
              e.changedTouches[
                0
              ]
                ?.clientX ||
              0;

          },
          {
            passive:
              true
          }
        );


      carousel
        .addEventListener(
          "touchend",
          e => {

            const endX =
              e.changedTouches[
                0
              ]
                ?.clientX ||
              0;


            const delta =
              endX -
              touchStartX;


            if (
              Math.abs(
                delta
              ) >
              45
            ) {

              show(
                index +
                (
                  delta <
                  0
                    ? 1
                    : -1
                )
              );
            }


            restart();

          },
          {
            passive:
              true
          }
        );


      if (loading) {

        loading.hidden =
          false;
      }


      try {

        // ===================================================
        // POPUP LIST DARI APPS SCRIPT
        // ===================================================

        const data =
          await jsonp(
            POINT_CHALLENGE_URL,
            {
              action:
                "popup-list"
            }
          );


        if (
          !data ||
          data.ok ===
            false ||
          !Array.isArray(
            data.files
          )
        ) {

          throw new Error(
            data?.message ||
            "No popup files"
          );
        }


        // Hanya file PNG
        items =
          data.files
            .filter(
              file =>

                String(
                  file.mimeType ||
                  ""
                )
                  .toLowerCase() ===
                  "image/png" &&

                file.imageUrl
            );


        if (
          !items.length
        ) {

          throw new Error(
            "Belum ada PNG di folder popup"
          );
        }


        // Urutkan berdasarkan nama file:
        // 01_Welcome.png
        // 02_Challenge.png
        // dst
        items.sort(
          (
            a,
            b
          ) =>

            String(
              a.name ||
              ""
            )
              .localeCompare(
                String(
                  b.name ||
                  ""
                ),
                undefined,
                {
                  numeric:
                    true,
                  sensitivity:
                    "base"
                }
              )
        );


        if (
          fallback
        ) {

          fallback.hidden =
            true;
        }


        show(
          0
        );


        restart();


      } catch (
        error
      ) {

        console.info(
          "Popup Google Drive belum aktif. Menggunakan POPUP.png lokal.",
          error
        );


        items =
          [

            {
              name:
                "POPUP.png",

              mimeType:
                "image/png",

              imageUrl:
                "POPUP.png",

              updated:
                "local"
            }

          ];


        show(
          0
        );


      } finally {

        if (
          loading
        ) {

          loading.hidden =
            true;
        }
      }
    };


  // =========================================================
  // START POPUP
  // =========================================================

  document.addEventListener(
    "DOMContentLoaded",
    initPopupCarousel
  );

})();