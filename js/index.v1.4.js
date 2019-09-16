import { AUTO_ABILITY as AA, EXTRA_SKILL as ES, URL, CLASS, STATS, ELEMENT } from './const.js';
import { AbilityCard } from './ability-card.js';
import { Setting } from './settings.js';
import { Job } from './job.js';
import { getJSON, capitalize, numberWithCommas, parseInt2 } from './helper.js';
import { damageCalc } from './calculation.js';
import { Title } from './title.js';

var IS_GL = false;

var cards;
var jobs;

var curCard;

async function loadAllCards(data) {
	cards = AbilityCard.loadAllCards(data.attack_uc);
	let _cards = [...cards];
	const elements = [ELEMENT.fire, ELEMENT.water, ELEMENT.wind, ELEMENT.earth, ELEMENT.light, ELEMENT.dark];

	_cards.forEach((c, idx) => c.idx = idx);

	for (let element of elements) {
		$('#ability_template').append($('<optgroup/>').attr('label', capitalize(element)));
		_cards.filter(c => c.element === element)
			.sort((a, b) => (a.name < b.name) ? -1 : 1)
			.forEach(c => {
				$('#ability_template')
					.find('optgroup')
					.last()
					.append($('<option>', { value: c.idx, text: `${c.name} [${capitalize(c.type)}]` }
					));
			});
	}

	$('#ability_template').append($('<optgroup/>').attr('label', "Custom"));
	$('#ability_template').find('optgroup').last().append($('<option>', { value: -1, text: "Custom input ability" }));

	return Promise.resolve();
}

async function loadAllJobs(data) {
	jobs = Job.loadAllJobs(data);
	return Promise.resolve();
}

function cleanUp() {
	$('#ability_template').empty();
}

function renderLoading() {
	$('#loading_div').removeClass('d-none');
	$('#loading_div').addClass('d-flex');
	$('#main_div').show();
	$('#main_div').addClass("d-none");
	$('#main_div').fadeToggle("slow");
}

function renderRanking() {
	$('#loading_div').addClass('d-none');
	$('#loading_div').removeClass('d-flex');
	$('#main_div').hide();
	$('#main_div').removeClass("d-none");
	$('#main_div').fadeToggle("slow");

	OnAbilityChange();
}

async function init() {
	try {
		cleanUp();
		renderLoading()
		const [cardsJSON, jobsJSON] = await Promise.all([getJSON(IS_GL ? URL.GL_CARDS : URL.JP_CARDS), getJSON(URL.JOBS)]);
		await loadAllCards(cardsJSON);
		await loadAllJobs(jobsJSON);
		renderRanking()
		// console.dir(cards);
	} catch (e) {
		alert('error loading, please refresh the page');
		// TODO: render error page
		console.error(e);
	}
}

function OnAbilityChange() {
	var index = $("#ability_template").val()

	if (index != null && index >= 0) {
		curCard = cards[index];

		if (jobs != null) {
			UpdateChanges();
		}
	}
}

function OnInputChange() {
	var validateFields = [
		"input[name='atk_power']", "input[name='improved_crit']", "input[name='exploit_weakness']",
		"input[name='ee_power']", "input[name='attuned_chain']", "input[name='ability_chain']", "input[name='pb_power']", "input[name='ravage_power']",
		"input[name='multiply_mag']", "input[name='multiply_atk']", "input[name='supreme_effect']"]

	for (i = 0; i < validateFields.length; i++) {
		if (!$(validateFields[i]).val()) {
			$(validateFields[i]).val(0);
		}
	}

}

function UpdateChanges() {
	var setting = new Setting();
	var title = new Title();

	var dmgSortType = parseInt($("input[name='dmg_type']:checked").val());
	switch (dmgSortType) {
		case 0:
			// unbroken neutral dmg
			setting.isBroken = false;
			setting.isWeakness = false;
			break;
		case 1:
			// unbroken weakness dmg
			setting.isBroken = false;
			setting.isWeakness = true;
			break;
		case 2:
			// broken neutral dmg
			setting.isBroken = true;
			setting.isWeakness = false;
			break;
		case 3:
			// broken weakness dmg
			setting.isBroken = true;
			setting.isWeakness = true;
			break;
	}

	setting.ignoreLore = $("#ignore_lore").is(":checked");
	setting.ignoreElement = !($("#display_element").is(":checked"));
	/*isMaxRetribution: $("#max_retribution").is(":checked"),
	  isMaxReckoning: $("#max_reckoning").is(":checked"),
	  isCrossCounter: $("#cross_counter").is(":checked"),*/

	if (jobs != null) {
		$('#ability_img').attr('src', "img/supreme/" + curCard.img);
		$("input[name='atk_display']").val(curCard.attack);
		$("input[name='break_power_display']").val(curCard.break);
		ProcessRanking(setting, title);
	}
	else {
		alert("Error in loading job list. Please refresh the page and try again");
	}
}

function ProcessRanking(setting, title) {
	var resultList = [];

	// compute dmg for each job first
	for (let i = 0; i < jobs.length; i++) {
		if (IS_GL && !jobs[i].isReleaseGL) {
			continue;
		}

		let resultEntry = {
			job: jobs[i],
			dmgResult: damageCalc(curCard, jobs[i], setting, title)
		};

		if (!(resultEntry.dmgResult.damage == 0)) {
			resultList.push(resultEntry);
		}
	}

	resultList = resultList.sort(compareDmg);

	DisplayResult(resultList, setting);
}

function compareDmg(a, b) {
	if (a.dmgResult.damage < b.dmgResult.damage) {
		return 1;
	}
	else if (a.dmgResult.damage > b.dmgResult.damage) {
		return -1;
	}
	else {
		return 0;
	}
}

function DisplayResult(resultList, setting) {
	var dmgSortTypeName = ["Unbroken Neutral", "Unbroken Weakness", "Broken Neutral", "Broken Weakness"];
	var dmgSortType = parseInt($("input[name='dmg_type']:checked").val());
	var elemIcon = ["elem_fire.png", "elem_water.png", "elem_wind.png", "elem_earth.png", "elem_light.png", "elem_dark.png"];

	$("#result_list").empty();

	for (let i = 0; i < resultList.length; i++) {
		let job = resultList[i].job;
		let dmgResult = resultList[i].dmgResult;

		let displayDmg = numberWithCommas(dmgResult.damage);


		let resultHTML = "<div class=\"list-group-item list-group-item-action flex-column align-items-start\">";

		// Damage Label
		resultHTML += "<div class=\"text-center dmg-label\">";
		resultHTML += "<h4 class=\"mb-n1\">" + displayDmg + "</h4>";
		resultHTML += "<small>" + dmgSortTypeName[dmgSortType] + "</small>";

		resultHTML += "</div><div class=\"d-flex flex-wrap align-items-start\">"

		// Ranking label
		resultHTML += "<h4 class=\"mr-2 rank-label\">#" + (i + 1) + "</h4>";

		// Job Image label
		resultHTML += "<img class=\"mr-2 mb-1 job-img\" src=\"img/job/" + job.img + "\" width=\"70px\">";

		// Job Name and Orbs usage
		resultHTML += "<div><h5 class=\"mb-1\">" + job.name + "</h5>";


		// 1 = fire, 2 = water, 3 = wind, 4 = earth, 5 = light, 6 = dark
		// F, W, A, E, L, D
		resultHTML += "<p>";
		let orbset = [job.orbset1, job.orbset2];
		for (let i = 0; i < orbset.length; i++) {
			if (i >= 1 && orbset[i][0] !== ELEMENT.empty) {
				resultHTML += " / ";
			}
			for (let j = 0; j < orbset[i].length; j++) {
				switch (orbset[i][j]) {
					case ELEMENT.fire:
						resultHTML += "<img class=\"icon-img\" src=\"img/" + elemIcon[0] + "\">"
						break;
					case ELEMENT.water:
						resultHTML += "<img class=\"icon-img\" src=\"img/" + elemIcon[1] + "\">"
						break;
					case ELEMENT.wind:
						resultHTML += "<img class=\"icon-img\" src=\"img/" + elemIcon[2] + "\">"
						break;
					case ELEMENT.earth:
						resultHTML += "<img class=\"icon-img\" src=\"img/" + elemIcon[3] + "\">"
						break;
					case ELEMENT.light:
						resultHTML += "<img class=\"icon-img\" src=\"img/" + elemIcon[4] + "\">"
						break;
					case ELEMENT.dark:
						resultHTML += "<img class=\"icon-img\" src=\"img/" + elemIcon[5] + "\">"
						break;
				}
			}


		}
		resultHTML += "</p></div></div>";

		resultHTML += "<div class=\"d-flex flex-wrap\">";
		let dmgDivider = "<div class=\"mr-2\"> | </div>";
		resultHTML += "<div class=\"mr-2 perk-label font-weight-bold\">Total: </div>";

		if (curCard.isMagicBased()) {
			resultHTML += "<div class=\"mr-2 perk-label\">Magic +" + numberWithCommas(dmgResult.dmgTerm) + "%</div>";
		}
		else {
			resultHTML += "<div class=\"mr-2 perk-label\">Atk +" + numberWithCommas(dmgResult.dmgTerm) + "%</div>";
		}

		if (dmgResult.eeTerm > 0) {
			resultHTML += dmgDivider;
			resultHTML += "<div class=\"mr-2 perk-label\">Element Enhance +" + numberWithCommas(dmgResult.eeTerm) + "%</div>";
		}

		if (dmgResult.critTerm > 0) {
			resultHTML += dmgDivider;
			resultHTML += "<div class=\"mr-2 perk-label\">Improved Crit +" + numberWithCommas(dmgResult.critTerm) + "%</div>";
		}

		if (dmgSortType == 2 || dmgSortType == 3) {
			if (dmgResult.brokenTerm > 0) {
				resultHTML += dmgDivider;
				resultHTML += "<div class=\"mr-2 perk-label\">Painful Break +" + numberWithCommas(dmgResult.brokenTerm) + "%</div>";
			}
		}

		if (dmgSortType == 1 || dmgSortType == 3) {
			if (dmgResult.weakTerm > 0) {
				resultHTML += dmgDivider;
				resultHTML += "<div class=\"mr-2 perk-label\">Exploit Weakness +" + numberWithCommas(dmgResult.weakTerm) + "%</div>";
			}

		}

		if (dmgResult.ravageTerm > 0) {
			resultHTML += dmgDivider;
			resultHTML += "<div class=\"mr-2 perk-label\">Ravage +" + numberWithCommas(dmgResult.ravageTerm) + "%</div>";
		}

		if (dmgResult.ucTerm > 0) {
			resultHTML += dmgDivider;
			resultHTML += "<div class=\"mr-2 perk-label\">Damage up (Supreme Effect) +" + numberWithCommas(dmgResult.ucTerm) + "%</div>";
		}

		resultHTML += "</div></div>";

		$("#result_list").append(resultHTML);
	}
}

(async () => {

	debug.switchVersion = () => {
		IS_GL = !IS_GL;
		init();
	}

	$(document).ready(function () {
		init();

		$("#ability_template").change(function () {
			OnAbilityChange();
		});

		$("#ignore_lore").change(function () {
			UpdateChanges();
		});

		$("#display_element").change(function () {
			UpdateChanges();
		});

		$("#max_retribution").change(function () {
			UpdateChanges();
		});

		$("#max_reckoning").change(function () {
			UpdateChanges();
		});

		$("#cross_counter").change(function () {
			UpdateChanges();
		});

		$("#sort_input").change(function () {
			UpdateChanges();
		});

		$("#ability_input").change(function () {
			OnInputChange();
		});

		$(function () {
			$('[data-toggle="tooltip"]').tooltip()
		})
	});
})();
