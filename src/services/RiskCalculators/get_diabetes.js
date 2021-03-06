/**
  
    Type II Diabetes Risk Score
    
    @param {int} age - the age of the patient (patient resource)
    @param {string} gender - sex of the patient (patient resource)
    @param {int} bmi - body mass index (condition resource)
    @param {boolean} hyperglycemia - condition records of hyperglycemia (condition resource)
    @param {boolean} historyOfAntihypDrugs - history of antihypertensive drugs (??? resource) //currently hardcoded
    @param {int} waist - waist circumference (condition resource)

    @return diabetes risk score

*/
import {calculateAge, pullCondition} from '../../services/risk_score_utils.js';
import { getNearestFlat, sortMeasurements } from '../../services/general_utils';

// const WAIST_CIRCUM = ['56115-9', '56114-2', '56117-5', '8280-0', '8281-8'];
// const BMI = '39156-5';

export function calcDiabetesRisk(age, gender, bmi, hyperglycemia, historyOfAntihypDrugs, waist) {
          //starts with the intercept
        let exp_factor = -5.514;
        //age -- double check this
        if (age < 54){
          exp_factor += 0.628;
        } else if (age >= 55){
          exp_factor += 0.892;
        } else {
          //its good that we have this, removed for demo.
          //alert ("This risk score does not apply, due to age restrictions.");
          //return;
        }

        //BMI
        if (bmi > 25 && bmi < 30){
          exp_factor += 0.165;
        } else if (bmi >= 30){
          exp_factor += 1.096;
        } else {
          //its good that we have this, removed for demo.
          //alert ("This risk score does not apply, due to BMI restrictions.");
          //return;
        }

        //high blood glucose
        if (hyperglycemia){
          exp_factor += 2.139;
        }

        //History of antihypertensive drug treatment
        if (historyOfAntihypDrugs){
          exp_factor += 0.711;
        }

        //waist circumference
        if (gender === "male"){
          if (waist > 94 && waist < 102){
            exp_factor += 0.857;
          } else if (waist >= 102 ) {
            exp_factor += 1.350;
          }
          // console.log("This is the first console: ",scoreSets[i]);
        } else if (gender === "female") {
          if (waist > 80 && waist < 88){
            exp_factor += 0.857;
          } else if (waist >= 89) {
            exp_factor += 1.350;
          }
        } else {
          //its good that we have this, removed for demo.
          //alert ("This risk score does not apply, due to gender restrictions.");
          //return;
        }
        //console.log("exp factor", exp_factor);
        var score = 100*(Math.pow(Math.E, exp_factor))/(1+Math.pow(Math.E, exp_factor));
        score = score.toFixed(0);
        //console.log("score", score);
        return score;
}

export function futureDiabetes(presMeasures = null, futureMeasures = null, pt = null, conds = null, meds = null, obs = null) {
  if(presMeasures && pt && futureMeasures && conds && meds && obs) {
      return calcDiabetesRisk(
        calculateAge(pt.birthDate),
        pt.gender,
        futureMeasures['39156-5'] || presMeasures['39156-5'],
        pullCondition(conds, ['80394007']).length !== 0,
        false,
        futureMeasures['56115-9'] || futureMeasures['56114-2'] || futureMeasures['56117-5'] || futureMeasures['8280-0'] || futureMeasures['8281-8'] ||
        presMeasures['56115-9'] || presMeasures['56114-2'] || presMeasures['56117-5'] || presMeasures['8280-0'] || presMeasures['8281-8']
      );
  }
  else if (presMeasures && pt && conds && meds && obs) {
      return calcDiabetesRisk(
        calculateAge(pt.birthDate),
        pt.gender,
        presMeasures['39156-5'],
        pullCondition(conds, ['80394007']).length !== 0,
        false,
        presMeasures['56115-9'] || presMeasures['56114-2'] || presMeasures['56117-5'] || presMeasures['8280-0'] || presMeasures['8281-8']
      );
  }
  return '...'
}

export function diabetesPast(date, pt = null, obs = null, conds = null, meds = null) {
    if(pt && obs && conds && meds) {
      // const codesObject = {
      //   '56115-9': [],
      //   '56114-2': [],
      //   '56117-5': [],
      //   '8280-0': [],
      //   '8281-8': [],
      //   '39156-5': []
      // };

      // due to the differences in where the data comes from, we have to check if we got the original data bundle
      // or if it is preprocessed from remote server by redux.
      let sortedObs;
      if(Array.isArray(obs[0])){
        sortedObs = sortMeasurements(obs);
      } else if (Object.keys(obs).length !== 0) {
        sortedObs = obs;

        // we want to make sure we have all of the necessary obs before we proceed.
        if (!(sortedObs.hasOwnProperty('56115-9') || sortedObs.hasOwnProperty('56114-2') || sortedObs.hasOwnProperty('56117-5') || sortedObs.hasOwnProperty('8280-0') || sortedObs.hasOwnProperty('8281-8')) || 
            !(sortedObs.hasOwnProperty('39156-5'))
            ) {
          return "...";
        }

      } else {
        return "...";
      }      

      let waistCirMeasurements = [];
      let bmiMeasurements = sortedObs['39156-5'].measurements;

      if(sortedObs.hasOwnProperty('56115-9'))
        waistCirMeasurements = waistCirMeasurements.concat(sortedObs['56115-9'].measurements);
      if(sortedObs.hasOwnProperty('56114-2'))
        waistCirMeasurements = waistCirMeasurements.concat(sortedObs['56114-2'].measurements);
      if(sortedObs.hasOwnProperty('56117-5')) {
        waistCirMeasurements = waistCirMeasurements.concat(sortedObs['56117-5'].measurements);
      }
      if(sortedObs.hasOwnProperty('8280-0'))
        waistCirMeasurements = waistCirMeasurements.concat(sortedObs['8280-0'].measurements)
      if(sortedObs.hasOwnProperty('8281-8'))
        waistCirMeasurements = waistCirMeasurements.concat(sortedObs['8281-8'].measurements)


      var hyperglycemia = pullCondition(conds, ['80394007']);
      let hyperglycemiaBool = false;
      let goalDate = new Date(date);
      for(let i = 0; i < hyperglycemia.length; i++){
        let currDate;
        // like in other risk calcs, we have to incluce both because of where the data comes from. 
        if(hyperglycemia[i].resource){
         currDate = new Date(hyperglycemia[i].resource.onsetDateTime)
        } else {
          currDate = new Date(hyperglycemia[i].onsetDateTime)
        }
        if(currDate < goalDate) {
          hyperglycemiaBool = true;
        }
      }
      if(waistCirMeasurements.length === 0 || bmiMeasurements.length === 0) {
          alert("Patient does not have enough measurements for Diabetes Risk Score");
          return;
      }
      else {
        // console.log
        let yearsYounger = (Date.now()-(new Date(date)))/1000/60/60/24/365
        return calcDiabetesRisk(calculateAge(pt.birthDate)-yearsYounger,
          pt.gender,
          getNearestFlat(bmiMeasurements, date).value,
          hyperglycemiaBool,
          false, //NEEDS TO BE FIXED
          getNearestFlat(waistCirMeasurements, date).value
          )
      }
  }
  return "..."
}

/**
    @param pt -- the patient resource
    @param obs -- the bundle that contains all observation resources
    @param conds -- the bundle that contains all condition resources
    @param -- the bundle that contains all medicationrequest resources
    @return the diabetes score as a percent
*/
export function diabetesScore(pt, obs, conds, medreq) {
  if(pt && obs && conds && medreq) {
    var waist = obs['56115-9'] //['56115-9', '56114-2', '56117-5', '8280-0', '8281-8'])
    var bmi = obs['39156-5']
    var hyperglycemia = pullCondition(conds, ['80394007']);
    if (!(waist && bmi)) {
      ////console.log(bmi, waist);
      return '...';
    }
    if (!(waist.measurements && bmi.measurements && waist.measurements[0] && bmi.measurements[0])) {
      return '...';
    }
    var score = calcDiabetesRisk(calculateAge(pt.birthDate),
      pt.gender,
      bmi.measurements[0].value,
      (hyperglycemia.length !== 0),
      false, //NEEDS TO BE FIXED
      waist.measurements[0].value);
    return score;
  }
  else {
    return '...'
  }
}
