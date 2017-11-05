/**
 * Created by watcher on 8/27/17.
 */
import { Meteor } from 'meteor/meteor'
import React from 'react'
import PropTypes from 'prop-types'
import BusinessLine from '../../components/BusinessLine/BusinessLine'
import PlaceLine from '../../components/PlaceLine/PlaceLine'
import ServiceLine from '../../components/ServiceLine/ServiceLine'
import SingleBusinessShow from '../../components/SingleBusinessShow/SingleBusinessShow'
import { Places, Services, CCustomers, getTranslate, toggleLoader, generateString, setResponseText } from '/imports/utilities'
import { PHONE_RULE } from '/imports/constants'

const Translate = getTranslate()
const { serviceTypes } = require('/imports/data/data.json')

class ClientBusinessManager extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			showMode: 'grid', // or single
			businessMode: 'place', // or service
			location: props.location,
			places: [],
			services: [],
			servicesFiltered: [],
			currentBusiness: {},
			filterBy: []
		}

		this.getCurrentView = this.getCurrentView.bind(this)
		this.clickFilterBusinessHandler = this.clickFilterBusinessHandler.bind(this)
		this.isCurrentFilterActive = this.isCurrentFilterActive.bind(this)
		this.makeBusinessSingleActive = this.makeBusinessSingleActive.bind(this)
		this.couponClickHandler = this.couponClickHandler.bind(this)
	}

	componentWillMount() {
		const singleBusinessID = this.props.singleBusinessID
		let { showMode, currentBusiness } = this.state

		if (singleBusinessID !== null) {
			toggleLoader(true)
			Meteor.subscribe('places', () => {
				currentBusiness = Places.findOne({_id: singleBusinessID}) || Services.findOne({_id: singleBusinessID})
				toggleLoader()
				if (typeof currentBusiness !== 'undefined') {
					showMode = 'single'

					this.setState({
						showMode,
						currentBusiness
					})
				}
			})
		}
	}

	componentWillReceiveProps(nextProps) {
		let { places } = this.state,
			nextLocation = nextProps.location,
			foundedServices = [],
			services = [],
			filterBy = []

		if (nextLocation && nextLocation.city.length) {
			places = Places.find(nextLocation, {sort: {rank: 1}}).fetch()
			for (let i = 0; i < places.length; i++) {
				foundedServices = foundedServices.concat(Services.find({relatedTo: {$in: [places[i]._id]}}, {sort: {rank: 1}}).fetch())
			}
			foundedServices.forEach(item => {
				if (!services.filter(_item => (item._id === _item._id)).length) {
					services.push(item)
				}
				if (filterBy.indexOf(item.serviceType) === -1) {
					filterBy.push(item.serviceType)
				}
			})
		} else {
			places = services = []
		}

		this.setState({
			location: nextLocation,
			places,
			showMode: 'grid',
			businessMode: 'place',
			servicesFiltered: [],
			currentBusiness: {},
			services,
			filterBy,
		})
	}

	clickFilterBusinessHandler(event) {
		const targetID = event.target.id,
			targetType = targetID.split('_')[1],
			isFilterActive = this.isCurrentFilterActive(targetType)
		let { showMode, services, businessMode } = this.state,
			servicesFiltered = showMode === 'grid' ? this.state.servicesFiltered : [],
			tempAr = []

		if (showMode === 'single') {
			servicesFiltered = services.filter(item => (item.serviceType === targetType))
		} else {
			if (isFilterActive) {
				servicesFiltered = servicesFiltered.filter(item => (item.serviceType !== targetType))
			} else {
				services.forEach(elem => {
					if (elem.serviceType === targetType) {
						tempAr = servicesFiltered.filter(_item => (elem._id === _item._id))
						if (!tempAr.length) {
							servicesFiltered.push(elem)
						}
					}
				})
			}
		}
		businessMode = servicesFiltered.length ? 'service' : 'place'
		this.setState({businessMode, servicesFiltered})
	}

	makeBusinessSingleActive(businessID) {
		let { showMode, currentBusiness, services, places } = this.state

		currentBusiness = services.concat(places).filter(item => (item._id === businessID))[0]
		if (typeof currentBusiness !== 'undefined') {
			showMode = 'single'

			this.setState({
				showMode,
				currentBusiness,
				servicesFiltered: []
			})
			this.forceUpdate()
		}
	}

	getCurrentView() {
		const { showMode, businessMode, places, servicesFiltered } = this.state

		return showMode === 'grid' ?
			<div className='business-grid'>
				{businessMode === 'place' ? places.map(place => (
					<PlaceLine
						key={Math.random()}
						_id={place._id}
						placeName={place.placeName}
						neighborhood={place.neighborhood}
						phone={place.placePhone}
						email={place.placeEmail}
						googleMapUrl={place.googleMapUrl}
						aroundView={place.aroundView}
						image={place.images.length ? place.images[0] : {}}
						makeBusinessSingleActive={this.makeBusinessSingleActive}
					/>
				)) :
					servicesFiltered.map(service => (
						<ServiceLine
							key={Math.random()}
							_id={service._id}
							serviceName={service.serviceName}
							neighborhood={service.neighborhood}
							phone={service.servicePhone}
							email={service.serviceEmail}
							googleMapUrl={service.googleMapUrl}
							aroundView={service.aroundView}
							image={service.images.length ? service.images[0] : {}}
							makeBusinessSingleActive={this.makeBusinessSingleActive}
						/>
					))}
			</div> :
			<SingleBusinessShow
				business={this.state.currentBusiness}
				couponClickHandler={this.couponClickHandler}
			/>
	}

	isCurrentFilterActive(serviceType) {
		let isActive = false,
			{ servicesFiltered } = this.state

		for (let i = 0; i < servicesFiltered.length; i++) {
			if (servicesFiltered[i].serviceType === serviceType) {
				isActive = true
				break
			}
		}
		return isActive
	}

	couponClickHandler(customerForm) {
		let { currentBusiness } = this.state,
			businessContact = currentBusiness[currentBusiness.businessType + 'Email'].length ?
				currentBusiness[currentBusiness.businessType + 'Email'] + '<br/>' :
				'',
			customer = {},
			customerCouponText = Translate.thisIsCouponLink + '\n'

		businessContact += currentBusiness[currentBusiness.businessType + 'Phone'].length ?
			currentBusiness[currentBusiness.businessType + 'Phone'] : ''

		if (customerForm[1].value.match(PHONE_RULE) === null) {
			setResponseText(Translate.phoneFormat, 0)
			return
		} else if (!customerForm.name.value.length) {
			setResponseText(Translate.emptyNameError, 0)
			return
		}

		customer = {
			couponToken: generateString() + generateString(),
			name: customerForm.name.value,
			phone: customerForm[1].value,
			dateCreated: new Date().toLocaleDateString(),
			businessData: {
				businessID: currentBusiness._id,
				businessType: currentBusiness.businessType,
				businessName: currentBusiness[currentBusiness.businessType + 'Name'],
				couponType: currentBusiness.couponType,
				couponValue: currentBusiness.couponValue,
				businessContact
			}
		}
		CCustomers.insert(customer, err => {
			if (err) {
				setResponseText(err.reason, 0)
			} else {
				customerCouponText = `${customerCouponText} ${location.origin}/coupon/${customer.couponToken}`
				Meteor.call('sendSms', customer.phone, customerCouponText, err => {
					err ? setResponseText(err.reason, 0) : setResponseText(Translate.youWillReceiveCoupon, 1)
				})
			}
		})
		customerForm.reset()
	}

	render() {
		const { filterBy, showMode, servicesFiltered, businessMode, places } = this.state,
			currentShow = this.getCurrentView()
		let isServicesThere = false

		return (
			<div className='client-business-area'>
				{currentShow}
				<div className='services-filter-grid'>
					{serviceTypes.map(type => {
						if (filterBy.indexOf(type.serviceType) !== -1) {
							isServicesThere = true
							return (
								<BusinessLine
									key={Math.random() * 112}
									onClickHandler={this.clickFilterBusinessHandler}
									item={type}
									isActive={this.isCurrentFilterActive(type.serviceType)}
								/>
							)
						}
					})}
					{businessMode === 'place' &&
						places.length &&
						!isServicesThere ? <span className='havent-business'>{Translate.unfortunatelyHaventBusiness}</span> : ''}
				</div>
				{showMode === 'single' ?
					<div className='business-grid'>
						{servicesFiltered.map(service => (
							<ServiceLine
								key={Math.random()}
								_id={service._id}
								serviceName={service.serviceName}
								neighborhood={service.neighborhood}
								phone={service.servicePhone}
								email={service.serviceEmail}
								googleMapUrl={service.googleMapUrl}
								aroundView={service.aroundView}
								image={service.images.length ? service.images[0] : {}}
								makeBusinessSingleActive={this.makeBusinessSingleActive}
							/>
						))}
					</div> : ''}
			</div>
		)
	}
}

ClientBusinessManager.propTypes = {
	location: PropTypes.object.isRequired,
	singleBusinessID: PropTypes.string
}

export default ClientBusinessManager
