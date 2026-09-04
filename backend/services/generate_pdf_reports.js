import { jsPDF } from "jspdf";
import fs from "fs";
import { runQuery } from '../lib/db.js';
import { writeLog } from '../lib/logger.js';


/*******************************************************************************
  main function to generate the pdf file
*******************************************************************************/

export async function generate_rhp_prescription(recipe) {
  let rows = [{
    gf: '0.00',
    bark: '0.00',
    compost: '0.00',
    trace: '0.00',
    coconb: '0.00',
    veen: '100.00',
    crf: '0'
  }];

  const query = `
    SELECT
      p.recipe_name,
      SUM(CASE WHEN pr.code_mixpro IN (65, 59) THEN d.dosing_preset ELSE 0 END) AS gf,
      SUM(CASE WHEN pr.code_mixpro IN (63) THEN d.dosing_preset ELSE 0 END) AS bark,
      SUM(CASE WHEN pr.code_mixpro IN (62, 67, 61, 66) THEN d.dosing_preset ELSE 0 END) AS compost,
      SUM(CASE WHEN pr.code_mixpro IN (140) THEN d.dosing_preset ELSE 0 END) AS trace,
      SUM(CASE WHEN pr.origin_1 IN (55, 54) THEN d.dosing_preset ELSE 0 END) + SUM(CASE WHEN pr.origin_1 IN (261) THEN round(d.dosing_preset/2, 0) ELSE 0 END) AS coconb,
      SUM(CASE WHEN pr.origin_1 IN (256, 14, 8, 262) THEN d.dosing_preset ELSE 0 END) + SUM(CASE WHEN pr.origin_1 IN (261) THEN round(d.dosing_preset/2, 0) ELSE 0 END)AS veen,
      SUM(CASE WHEN pr.iscrf = TRUE THEN 1 ELSE 0 END) AS crf,
      SUM(CASE WHEN pr.isorg = TRUE THEN 1 ELSE 0 END) AS org
    FROM
      batch_dosing AS d
    INNER JOIN
      (SELECT
        i.production_id,
        i.recipe_name
      FROM
        batch_info AS i
      LEFT JOIN sap_recipes_codes AS c ON i.recipe_code = c.mixpro_code
      WHERE
        sap_code = ?
      ORDER BY time_start DESC
      LIMIT 1) AS p ON p.production_id = d.production_id
    INNER JOIN
      products AS pr ON pr.code_mixpro = d.product_code
    WHERE
      pr.product_group != 'n/a' && pr.product_group != 'liquid'
    ORDER BY product_group;
  `;

  try {
    rows = await runQuery(query, [recipe]);
  } catch (err) {
    console.error(err.message);
  }

  try {
    const doc = new jsPDF();

    // load calibri fonts
    const calibri = fs.readFileSync("fonts/calibri.ttf", "base64");
    const calibrib = fs.readFileSync("fonts/calibrib.ttf", "base64");
    const calibrii = fs.readFileSync("fonts/calibrii.ttf", "base64");

    doc.addFileToVFS("calibri.ttf", calibri);
    doc.addFileToVFS("calibrib.ttf", calibrib);
    doc.addFileToVFS("calibrii.ttf", calibrii);

    doc.addFont("calibri.ttf", "calibri", "normal");
    doc.addFont("calibrib.ttf", "calibri", "bold");
    doc.addFont("calibrii.ttf", "calibri", "italic");

    // load images
    const rhp_logo = fs.readFileSync("img/logo_rhp.png", { encoding: "base64" });
    const kd_logo = fs.readFileSync("img/logo_kd.jpg", { encoding: "base64" });
    const blue_box = fs.readFileSync("img/blue_box.png", {encoding : "base64" });
    const score_1 = fs.readFileSync("img/score_1.png", {encoding : "base64"});
    const score_2 = fs.readFileSync("img/score_2.png", {encoding : "base64"});
    const score_3 = fs.readFileSync("img/score_3.png", {encoding : "base64"});
    const qr_code = fs.readFileSync("img/rhp_qr.png", {encoding : "base64"});

    const score_images = {
      1: score_1,
      2: score_2,
      3: score_3
    };

    // draw logo's
    doc.addImage(rhp_logo, "PNG", 18,20,18,15);
    doc.addImage(kd_logo, "JPG", 160,20,28,16);

    // add header text
    doc.setFont("calibri", "bold");
    doc.setFontSize(8);
    doc.text("DATUM: " + new Date().toLocaleDateString("nl-BE"),
      188,
      45,
      { align: "right" });
    doc.setFontSize(15);
    doc.text("Bijsluiter bij: " + rows[0].recipe_name.replace(recipe, "") + " (art. nr. " + recipe + ")",
      18,
      52);

    doc.setFont("calibri", "normal");
    doc.setFontSize(10);
    doc.text("Het geleverde mengsel is met uiterste zorg samengesteld en voldoet aan de hoge RHP-kwaliteitseisen. Het substraat heeft de volgende aandachtspunten.",
      18,
      57,
      {maxWidth: 170});

    // draw boxes
    doc.setLineWidth(0.2);
    doc.rect(18, 66, 170, 75.5);
    doc.rect(18, 141.5, 170, 33);
    doc.rect(18, 179, 170, 51);

    // add score with wording
    doc.addImage(score_images[get_nmobilisation(rows[0].gf, rows[0].bark)], "PNG", 19.2, 73.8, 22.8, 7.6);
    doc.addImage(score_images[Math.max(
        get_mangaan(rows[0].gf, rows[0].bark, rows[0].compost, rows[0].trace),
        get_natrium(rows[0].coconb, rows[0].compost),
        get_kalium(rows[0].coconb, rows[0].compost),
        get_calcium(rows[0].coconb),
        get_magnesium(rows[0].coconb))],
    "PNG", 19.2, 87.8, 22.8, 7.6);
    doc.addImage(score_images[get_buffer(rows[0].veen, rows[0].compost)], "PNG", 19.2, 101.8, 22.8, 7.6);
    doc.addImage(score_1, "PNG", 19.2, 115.8, 22.8, 7.6);

    doc.setFont("calibri", "normal");
    doc.setFontSize(9.8);
    doc.text(get_worded_nmobilisation(get_nmobilisation(rows[0].gf, rows[0].bark)),
      74.5, 79.2
    );
    let ferts = get_fertilizers_worded(
        get_mangaan(rows[0].gf, rows[0].bark, rows[0].compost, rows[0].trace),
        get_natrium(rows[0].coconb, rows[0].compost),
        get_kalium(rows[0].coconb, rows[0].compost),
        get_calcium(rows[0].coconb),
        get_magnesium(rows[0].coconb));
    if(ferts.length < 78){
       doc.text(ferts, 74.5, 93.2);
    } else {
       doc.text(ferts, 74.5, 90.6);
    }
    doc.text(get_buffer_worded(get_buffer(rows[0].veen, rows[0].compost)),
      74.5, 107.2
    );
    doc.text("Dit substraat heeft normale aandacht nodig aangaande de watergift.",
      74.5, 121.2
    );

    doc.text(get_crf_org_worded(get_crf(rows[0].crf), get_org(rows[0].org)), 19, 130, {maxWidth: 170});

    // draw blue boxes and blue letters
    doc.addImage(blue_box, "PNG", 18.1, 72, 55, 11.5);
    doc.addImage(blue_box, "PNG", 18.1, 86, 55, 11.5);
    doc.addImage(blue_box, "PNG", 18.1, 100, 55, 11.5);
    doc.addImage(blue_box, "PNG", 18.1, 114, 55, 11.5);
    doc.setFont("calibri", "bold");
    doc.setFontSize(13.5);
    doc.setTextColor("#00ABC4");
    doc.text("STIKSTOF", 68, 79.5, {align: "right" });
    doc.text("BEMESTING", 68, 93.5, {align: "right" });
    doc.text("pH-BUFFER", 68, 107.5, {align: "right" });
    doc.text("WATERGIFT", 68, 121.5, {align: "right" });
    doc.setTextColor("#000000")

    // create legend and draw QR code
    doc.setFont("calibri", "bold");
    doc.setFontSize(8);
    doc.text("Legenda:", 19, 145);
    doc.setFontSize(9.5);
    doc.text("Scan de QR-code voor meer informatie over de aandachtspunten:",
      75,
      145,
      {maxWidth: 57});
    doc.setFont("calibri", "normal");
    doc.setFontSize(8);
    doc.text("normale aandacht nodig", 30, 150);
    doc.text("extra aandacht nodig", 30, 158);
    doc.text("veel aandacht nodig", 30, 166);
    doc.addImage(qr_code, "PNG", 85.5, 149.5, 24, 24);
    doc.addImage(score_1, 19, 147.5, 9, 3);
    doc.addImage(score_2, 19, 155.5, 9, 3);
    doc.addImage(score_3, 19, 163.5, 9, 3);

    // add extra info
    doc.setFont("calibri", "normal");
    doc.setFontSize(8);
    doc.text("[In dit vak kunt u als bedrijf aanvullende informatie vermelden.]\n\nVoor meer informatie contacteer uw Klasmann-Deilmann vertegenwoordiger. \nTEL: +32 50 321388", 19, 184);

    // create diclaimer at bottom of page.
    doc.setFontSize(6.4);
    doc.setFont("calibri", "bold");
    doc.text("Disclaimer:", 18, 240)
    doc.setFont("calibri", "italic");
    doc.text(" De informatie vermeld in deze bijsluiter is gebaseerd op de meest actuele kennis van de substraatproducent en RHP. Deze bijsluiter is bedoeld om het risico te beperken dat ",
      18 + doc.getTextWidth("Disclaimer: "),
      240,
      {maxWidth: 170});
    doc.text("gebruik van het substraatproduct tot schade leidt. U zult de substraatproducent en/of RHP niet aanspreken tot vergoeding van schade die voortvloeit uit informatie die vermeld staat in deze bijsluiter. Er kunnen geen rechten jegens substraatproducent of RHP ook niet door derden worden ontleend aan deze bijsluiter. Indien u de geleverde substraatproducten aan een derde verstrekt, bent u gehouden die derde op de inhoud van deze bijsluiter (waaronder deze disclaimer) te wijzen.",
      18,
      240 + 2.5,
      {maxWidth: 170});

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return pdfBuffer;
  } catch(err){
    writeLog({"type": "error", "message": err.message, "stack": err.stack}, 'pdf_gen');
  }
}


/*******************************************************************************
 Functions to calculate integers for every part of the RHP prescription
*******************************************************************************/

// N-immobilisation
function get_nmobilisation(gf, bark){
  gf = Number(gf);
  bark = Number(bark);

  if(gf + bark/3 >= 15){
    if(gf + bark/3 >= 25){
      return 3;
    } else {
      return 2;
    }
  } else {
    return 1;
  }
}

// Fertilizers
function get_mangaan(gf, bark, compost, trace){
  gf = Number(gf);
  bark = Number(bark);
  compost = Number(compost);
  trace = Number(trace);

  if ((gf + bark + compost + (trace/0.05 * 15)) >= 15){
    if((gf + bark + compost + (trace/0.15 * 25)) >= 25){
      return 3;
    } else {
      return 2;
    }
  } else {
    return 1;
  }
}

function get_natrium(cocoNB, compost){
  cocoNB = Number(cocoNB);
  compost = Number(compost);

  if (cocoNB + compost >= 15){
    if(cocoNB + compost >= 25){
      return 3;
    } else {
      return 2;
    }
  } else {
    return 1;
  }
}

function get_kalium(cocoNB, compost){
  cocoNB = Number(cocoNB);
  compost = Number(compost);

  if (cocoNB + compost >= 10){
    if(cocoNB + compost >= 30){
      return 3;
    } else {
      return 2;
    }
  } else {
    return 1;
  }
}

function get_calcium(cocoNB){
  cocoNB = Number(cocoNB);

  if (cocoNB >= 50){
    if(cocoNB >= 80){
      return 3;
    } else {
      return 2;
    }
  } else {
    return 1;
  }
}

function get_magnesium(cocoNB){
  cocoNB = Number(cocoNB);

  if (cocoNB >= 50){
    if(cocoNB >= 80){
      return 3;
    } else {
      return 2;
    }
  } else {
    return 1;
  }
}

// pH buffering
function get_buffer(veen , compost){
  veen = Number(veen);
  compost = Number(compost);

  if(veen + compost < 50){
    if(veen + compost < 25){
      return 3;
    } else {
      return 2;
    }
  } else {
    return 1;
  }
}

// Waterdosing
function get_watering(air, wok){
  air = Number(air);
  wok = Number(wok);

  if(air >= 25 || wok > 2){
    if (air >= 45 || wok > 3){
      return 3;
    } else {
      return 2;
    }
  } else {
    return 1;
  }
}

// Controlled Release Fertilizers (CRF)
function get_crf(crf){
  crf = Number(crf);

  if (crf > 0){
    return 1;
  } else {
    return 0;
  }
}

// Organic Fertilizers
function get_org(org){
  org = Number(org);

  if (org > 0){
    return 1;
  } else {
    return 0;
  }
}


/*******************************************************************************
 Functions to create the worded version of the prescription
*******************************************************************************/

const outcomes = {
  // N-immobilisation outcomes
  "n-1": "Dit substraat heeft geen hoge N-immobilisatie.",
  "n-2": "Dit substraat heeft aandacht nodig aangaande de stikstofgift.",
  "n-3": "Dit substraat heeft veel aandacht nodig aangaande de stikstofgift.",
  // fertilisation outcomes
  "f-none": "Dit substraat heeft geen speciale aandacht nodig aangaande overige bemesting.",
  "ca-1": "",
  "ca-2": "Dit substraat bevat een lagere concentratie calcium en magnesium.",
  "ca-3": "Dit substraat bevat een lage concentratie calcium en magnesium.",
  "1-1-1": "",
  "1-1-2": "Dit substraat bevat een hogere concentratie kalium.",
  "1-1-3": "Dit substraat bevat een hoge concentratie kalium.",
  "1-2-1": "Dit substraat bevat een hogere concentratie natrium.",
  "1-2-2": "Dit substraat bevat een hogere concentratie natrium en kalium.",
  "1-2-3": "Dit substraat bevat een hogere concentratie natrium.\nDit substraat bevat een hoge concentratie kalium.",
  "1-3-1": "Dit substraat bevat een hoge concentratie natrium.",
  "1-3-2": "Dit substraat bevat een hogere concentratie kalium.\nDit substraat bevat een hoge concentratie natrium.",
  "1-3-3": "Dit substraat bevat een hoge concentratie natrium en kalium.",
  "2-1-1": "Dit substraat bevat een hogere concentratie mangaan.",
  "2-1-2": "Dit substraat bevat een hogere concentratie mangaan en kalium.",
  "2-1-3": "Dit substraat bevat een hogere concentratie mangaan. \nDit substraat bevat een hoge concentratie kalium.",
  "2-2-1": "Dit substraat bevat een hogere concentratie mangaan en natrium.",
  "2-2-2": "Dit substraat bevat een hogere concentratie mangaan, natrium en kalium.",
  "2-2-3": "Dit substraat bevat een hogere concentratie mangaan en natrium.\nDit substraat bevat een hoge concentratie kalium.",
  "2-3-1": "Dit substraat bevat een hogere concentratie mangaan.\nDit substraat bevat een hoge concentratie natrium.",
  "2-3-2": "Dit substraat bevat een hogere concentratie mangaan en kalium.\nDit substraat bevat een hoge concentratie natrium.",
  "2-3-3": "Dit substraat bevat een hogere concentratie mangaan.\nDit substraat bevat een hoge concentratie natrium en kalium.",
  "3-1-1": "Dit substraat bevat een hoge concentratie mangaan.",
  "3-1-2": "Dit substraat bevat een hogere concentratie kalium.\nDit substraat bevat een hoge concentratie mangaan.",
  "3-1-3": "Dit substraat bevat een hoge concentratie mangaan en kalium.",
  "3-2-1": "Dit substraat bevat een hogere concentratie natrium.\nDit substraat bevat een hoge concentratie mangaan.",
  "3-2-2": "Dit substraat bevat een hogere concentratie natrium en kalium.\nDit substraat bevat een hoge concentratie mangaan.",
  "3-2-3": "Dit substraat bevat een hogere concentratie natrium.\nDit substraat bevat een hoge concentratie mangaan en kalium.",
  "3-3-1": "Dit substraat bevat een hoge concentratie mangaan en natrium.",
  "3-3-2": "Dit substraat bevat een hogere concentratie kalium.\nDit substraat bevat een hoge concentratie mangaan en natrium.",
  "3-3-3": "Dit substraat bevat een hoge concentratie mangaan, natrium en kalium.",
  // pH buffering outcomes
  "b-1": "Dit substraat heeft geen speciale aandacht nodig aangaande de pH-buffer.",
  "b-2": "Dit substraat heeft een kleinere pH-buffer.",
  "b-3": "Dit substraat heeft een kleine pH-buffer.",
  // Waterdosing outcomes
  "w-1":"Dit substraat heeft normale aandacht nodig aangaande de watergift.",
  "w-2":"Dit substraat heeft meer aandacht nodig aangaande de watergift.",
  "w-3":"Dit substraat heeft veel aandacht nodig aangaande de watergift.",
  // Fertilizer typing outcomes
  "f-0-0":"",
  "f-0-1":"Dit mengsel bevat organische meststoffen. Dat betekent dat de pH en het bemestingsniveau zal variëren en het heeft een specifieke dynamiek.",
  "f-1-0":"Dit mengsel bevat CRF-meststoffen. Het type, de vochtigheid en de temperatuur bepalen de vrijgave.",
  "f-1-1":"Dit mengsel bevat CRF-meststoffen. Het type, de vochtigheid en de temperatuur bepalen de vrijgave.\nDit mengsel bevat organische meststoffen. Dat betekent dat de pH en het bemestingsniveau zal variëren en het heeft een specifieke dynamiek."
};

// N-immobilisation
function get_worded_nmobilisation(n_mob){
  return outcomes[`n-${n_mob}`];
}

// Fertilizers
function get_fertilizers_worded(mn, na, k, ca, mg){
  if(mn + na + k + ca + mg < 6){
    return outcomes[`f-none`];;
  } else {
    let high = outcomes[`${mn}-${na}-${k}`];
    let low = outcomes[`ca-${ca}`];
    if(high === "" || low === ""){
      return high + low;
    } else {
      return high + "<br>" + low;
    }
  }
}

// pH buffering
function get_buffer_worded(buf){
  return outcomes[`b-${buf}`];
}

// Waterdosing
function get_watering_worded(wat){
  return outcomes[`w-${wat}`];
}

// Fertilizer typing (CRF and/or Organic)
function get_crf_org_worded(crf, org){
  return outcomes[`f-${crf}-${org}`];
}
