import React, { Component } from 'react';
export default class LastVisit extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		var mostRecentEncounter = this.props.encounters[0];
		var mostRecentDate = mostRecentEncounter.effectiveDateTime;
		return (
			<div>
				Last Visit: {mostRecentDate} icon
			</div>
		);
	}

}