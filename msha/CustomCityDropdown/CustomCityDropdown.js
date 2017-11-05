/**
 * Created by watcher on 5/20/17.
 */
import React from 'react'
import { FormControl } from 'react-bootstrap'
import { createSelectItems, getCookie } from '/imports/utilities'
import { LANGUAGE_VERSION_VALUES } from '/imports/constants'
import countryRegionCityData from '/imports/countryRegionCityData'

const selectedVersion = getCookie('lang') || 'ar'
const Translate = selectedVersion === 'en' ? require('/imports/translate/en.json')[0] : require('/imports/translate/ar.json')[0]

class CustomCityDropdown extends React.Component {
	constructor (props) {
		super(props)
	}

	render () {
		const { onChange, country, region, value, name } = this.props,
			regions = (typeof country !== 'undefined' && country !== 'all' && country.length > 0) ? countryRegionCityData.filter(item => {
				return item['countryName' + LANGUAGE_VERSION_VALUES[selectedVersion]] === country
			})[0].regions : [],
			cities = (country !== 'all' && regions.length > 0 && typeof region !== 'undefined' && region.length > 0) ? regions.filter(item => {
					return item['regionName' + LANGUAGE_VERSION_VALUES[selectedVersion]] === region
				})[0].cities : [],
			disabled = !(region && region.length > 0)
		if (region === 'all' && cities.length === 0) {
			countryRegionCityData.map(item => {
				let regions = item.regions
				regions.map(region => {
					for (let i = 0; i < region.cities.length; i++) {
						cities.push(region.cities[i])
					}
				})
			})

		}
		return (
			<FormControl name={name} componentClass='select' onChange={e => onChange(e.target.value)} value={value} disabled={disabled}>
				<option value=''>{Translate.pleaseSelectCity}</option>
				{createSelectItems(cities, 'get_cities')}
			</FormControl>
		)
	}
}

export default CustomCityDropdown
