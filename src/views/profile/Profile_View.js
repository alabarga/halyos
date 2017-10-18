import 'purecss/build/pure.css';
import React, { Component } from 'react';

import VitalTile from '../../components/VitalTile';
import {FilteredList, List} from '../../components/FilteredList.js';
import EnvironmentTile from '../../components/EnvironmentFactors.js';
import AppointmentsTile from '../../components/AppointmentsTile';
import Name from '../../components/Name.js';
import LastVisit from '../../components/LastVisit.js';

import PollenContainer from '../../components/env/PollenContainer.js'
import AirQuality from '../../components/env/AirQuality.js';
import Flu from '../../components/env/Flu.js';
import {envTileStyle} from '../../styles/Environment-style.js';
import { headerStyle, apptListStyle } from '../../styles/AppointmentsTile-style';


import Scale from '../../components/logos/scale';
import BP from '../../components/logos/blood-pressure.js';
import Cholesterol from '../../components/logos/chol';
import Glucose from '../../components/logos/glucose';
import PastGraph from '../../components/Graphs/Past-Graph.js';
//import {getTopObservations, getTopObservationsDemo, SparklinesReferenceLine} from '../../services/patient_view_utils.js'
//import { LineChart, Line, Tooltip } from 'recharts';

//import {Diabetes, COPD, KFScore, CHADScore, ReynoldsScore, RiskTile, HelpRiskTile} from '../RiskCalculators/Risk_Components.js';
import {reynoldsScore} from '../../services/RiskCalculators/reynolds.js'
import {CHADScore} from '../../services/RiskCalculators/CHAD.js'
import {KFScore} from '../../services/RiskCalculators/get_KFRisk.js'
import {COPDScore} from '../../services/RiskCalculators/COPD.js'
import {diabetesScore} from '../../services/RiskCalculators/get_diabetes.js'
import RiskTile from '../../components/RiskTiles/RiskTile.js'
import HelpRiskTile from '../../components/RiskTiles/HelpRiskTile.js'
import {getPtLoc} from '../../services/Environment/environmental_utils.js'


import { VictoryArea, VictoryTooltip, VictoryGroup, VictoryScatter, createContainer, VictoryChart, VictoryLine, VictoryAxis, VictoryZoomContainer, VictoryBrushContainer, VictoryBar } from 'victory';
import Slider, { Range } from 'rc-slider';
import 'rc-slider/assets/index.css';
import {AboutMeasurement} from '../../components/AboutMeasurement.js';
import {AboutRisk} from '../../components/AboutRisk.js';

import { getPatID } from '../../services/smart_setup'

//import AboutRisk from '../risk/AboutRisk.js';

class ProfileView extends Component {
  constructor(props){
    super(props);
  }

  componentDidMount(){
   console.log("mounted: ",this.props.dispatch);
   this.props.getPatientDemographics(getPatID());
   // console.log("here we are! ", this.props);
  }

  render(){ 
    if (this.props.isFetchingAllPatientData || !this.props.patient){
      return (
        <div>Loading...</div>
      ) 
    }
    console.log("all patient data", this.props.patient.address[0])
    //const ptLoc = {"country_code":"US","region_code":"MA","city":"Pepperell","zip_code":"01463","latitude":42.669838,"longitude":-71.5961267};
    //const patient = {"gender": "Male", "birthDate":'1979-02-03-12:45'};
    let lat;
    let long;
    if(this.props.patient.address[0].extension[0].url.endsWith("geolocation")){
      if (this.props.patient.address[0].extension[0].extension[0].url == "latitude"){
        console.log("we in here");
        lat = this.props.patient.address[0].extension[0].extension[0].valueDecimal;
        long = this.props.patient.address[0].extension[0].extension[1].valueDecimal;
      } else {
        console.log("we in there");
        long = this.props.patient.address[0].extension[0].extension[0].valueDecimal;
        lat = this.props.patient.address[0].extension[0].extension[1].valueDecimal;
      }
    } else {
      //TODO: we gotta add a function here that goes and gets it if we don't have it
      //likewise, vice versa, given lat and long, go get the location info
      console.log("we don't have it! ");
    }
    var ptLoc = {"country_code": this.props.patient.address[0].country,
                 "region_code":this.props.patient.address[0].state,
                 "city":this.props.patient.address[0].city,
                 "zip_code": this.props.patient.address[0].postalCode,
                 "latitude": lat,
                 "longitude": long,
               }
    
    var patient = {"gender": this.props.patient.gender, "birthDate":this.props.patient.birthDate};
    const measurements = [{"name": "Systolic Blood Pressure", "units": "mmHg", "past": "120", "present": "110", "future":"110" },
    {"name": "Diastolic Blood Pressure", "units": "mmHg", "past": "90", "present": "95", future:95 },
    {"name": "Heart Rate", "units": "bpm", "past": "90", "present": "70" , future: 80},
    {"name": "Respiration Rate", "units": "breaths/min", "past": "18", "present": "18" , future:17}]
    const graphData = [{x:new Date("2017-02-03"), y:124}, {x:new Date("2017-02-12"), y:120}, {x:new Date("2017-02-15"), y:119}, 
		{x:new Date("2017-02-23"), y:132}, {x:new Date("2017-03-03"), y:126}, {x:new Date("2017-03-23"), y:129}, {x:new Date("2017-04-03"), y:125}];
    const mappedMeasures = measurements.map((measurements) =>
      <tr className = "pure-table pure-table-horizontal">
        <td> {measurements["name"]} [{measurements["units"]}] </td>
        <td> {measurements["past"]}</td>
        <td> {measurements["present"]}</td>
        <td> {measurements["future"]} </td>
      </tr>
    );
    return (
      <div>
        <div className="pure-g">
          <div className="pure-u-1-5"><RiskTile scoreName="General Cardiac" score={8.7} sym="%" context="within 10 years" url="General_Cardiac"/> </div>
          <div className="pure-u-1-5"><RiskTile scoreName="Stroke" score={12} sym="%" context="within 1 year" url="Stroke"/></div>
          <div className="pure-u-1-5"><RiskTile scoreName="Kidney Failure" score={3.6} sym="%" context="within 5 years" url="Kidney_Failure"/></div>
          <div className="pure-u-1-5"><RiskTile scoreName="COPD Mortality" score={1.4} sym="%" context="within 4 years" url="COPD_Mortality"/></div>
          <div className="pure-u-1-5"><RiskTile scoreName="Diabetes" score={13} sym="%" context="within 5 years" url="Diabetes"/></div>
        </div>
        <br/><br/>
        <div>
          <div className="pure-u-1-2" style={{"padding-left":"2px", "padding-right":"20px", "height":"300px", "overflow":"auto"}}>
            <FilteredList measurements={measurements}/>
          </div>
          <div className="pure-u-8-24">
            <AppointmentsTile patient={patient}/>
          </div>
          <div className="pure-u-4-24">
            <div style={{"order":"2"}}>
              <div style={{"display":"flex", "flex-direction":"row", "justify-content":"center"}}>
                <div style={{"display":"flex", "flex-direction":"column", "justify-content": "center"}}>
                  <div style={{"textAlign":'center', "fontSize": "20", "order":"1"}}>
                    Environment
                  </div>
                  <div style={{"order":"2"}}>
                    <div style={envTileStyle}>
                      <PollenContainer location={ptLoc} />
                    </div>
                  </div>
                  <div style={{"order":"3"}}>
                    <div style={envTileStyle}>
                      <AirQuality location={ptLoc} />
                    </div>
                  </div>
                  <div style={{"order":"4"}}>
                    <div style={envTileStyle}>
                      <Flu location={ptLoc} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
	      <div className="pure-u-1-2">
    		  <PastGraph obs_data={graphData} 
      			units="mmHg" 
      			reference_range={{min:110, max: 130}}
      			mainWidth={500}
      			mainHeight={200}
      			viewWidth={500}
      			viewHeight={50}/>
		      {/*<AboutMeasurement measurementCode="2085-9"/> <br/> <br/> <br/>
		      <AboutRisk risk="General_Cardiac"/>*/}
		    </div>
      </div>
    )
  }

}

export default ProfileView;
