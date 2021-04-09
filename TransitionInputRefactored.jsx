import React, { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import ClickOutHandler from 'react-onclickout';
import PlacesAutocomplete, { geocodeByAddress } from 'react-places-autocomplete';
import { Input } from 'semantic-ui-react';

const roundTransactionValue = (value) => {
  return Math.round(value / 1000) * 1000;
}

// 1. Convert from Base Component to Funciontal Component
const TransitionInput = observer((OnboardHykeStore, props) => {
  // 2. Start using hooks
  const [edit, setEdit] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [oldValue, setOldValue] = React.useState('');
  
  // 3. Extract variables from the OnboardHykeStore and avoid the repetitive code
  // 4. Adding meaninful variables names, general names like index or name does not have enough context
  const {
    transactionInfo,
    transitionClientInfo,
    transactionClientId,
    updateClientInfo,
    getTransitionPlanPotentialSavings,
    updateTransactionInfo,
    handleParsedBusinessAddress,
    handleParsedHomeAddress
  } = OnboardHykeStore;
  const { approved: transactionApproved } = transactionInfo;
  const {
    index: transactionIndex,
    name: transactionName,
    clientInfo,
    notes,
    link,
    boolean,
    value,
    placesInput,
    dollar,
    placeholder
  } = props;

  // 5. Avoid literal values to be used directly in the code, we should define it in a variable in case we need to reuse it
  const clientInfoAvailableProps = ['home_address', 'business_address', 'home_aptunit', 'business_aptunit'];
  const advisedSalaryTransactionInfo = 'advised_salary';
  const businessAddressTransactionInfo = 'business_address';
  const homeAddressTransactionInfo = 'home_address';

  const enterEditMode = () => {
    if (!transactionApproved) {
      setOldValue(transactionIndex ?
        transactionInfo[transactionName][transactionIndex] :
        transactionInfo[transactionName]);
      setEdit(true);
    }
  };

  const cancelEdit = () => {
    if (transactionIndex) {
      transactionInfo[transactionName][transactionIndex - 1] = oldValue;
    } else {
      transactionInfo[transactionName] = oldValue;
    }
    setEdit(false);
  };

  const saveEdit = (removeBtn) => {
    if (clientInfo && clientInfoAvailableProps.includes(transactionName)) {
      updateClientInfo(transactionName);
    } else if (!transactionApproved) {
      if (transactionName === advisedSalaryTransactionInfo) {
          transactionInfo[transactionName] = roundTransactionValue(transactionInfo[transactionName]);
          getTransitionPlanPotentialSavings();
      }
      updateTransactionInfo(transactionClientId);
    }

    setEdit(false);
    setHover(!!removeBtn);
  };

  const convertToBoolean = (e) => {
    const { value: selectValue } = e.target
    transactionInfo[transactionName] = selectValue === 'Yes';
  };

  const setHoverTrue = () => {
    setHover(clientInfo || !transactionApproved);
  };

  const getTransactionClientInfoStore = () => {
    if(transactionIndex) {
      return transitionClientInfo[transactionName][transactionIndex - 1];
    } else {
      return transitionClientInfo[transactionName];
    }
  }

  const setTransactionClientInfoStore = (transactionValue) => {
    if(transactionIndex) {
      transitionClientInfo[transactionName][transactionIndex - 1] = transactionValue;
    } else {
      transitionClientInfo[transactionName] = transactionValue;
    }
  }

  const getTransactionInfoStore = () => {
    if(transactionIndex) {
      return transitionClientInfo[transactionName][transactionIndex - 1];
    } else {
      return transitionClientInfo[transactionName];
    }
  }

  const setTransactionInfoStore = (transactionValue) => {
    if(transactionIndex) {
      transactionInfo[transactionName][transactionIndex - 1] = transactionValue;
    } else {
      transactionInfo[transactionName] = transactionValue;
    }
  }

  const getTransactionValue = () => {
    if(clientInfo) {
      return getTransactionClientInfoStore();
    } else {
      return getTransactionInfoStore();
    }
  }

  const setTransitionStore = (transactionValue) => {
    if (clientInfo) {
      setTransactionClientInfoStore(transactionValue);
    } else {
      setTransactionInfoStore(transactionValue);
    }
  }

  const handleInputChange = (e) => {
    const { value } = e.target;
    if (!transactionApproved) {
      setTransitionStore(value);
    }
  };

  const handleAddressChanged = (address) => {
    if (!transactionApproved) {
      setTransitionStore(address);
    }
  };

  const handleAddressSelected = (address) => {
    geocodeByAddress(address).then((results) => {
      if (transactionName === businessAddressTransactionInfo) {
        handleParsedBusinessAddress(results[0]);
        transitionClientInfo.updateBusinessAddress = true;
      } else if (transactionName === homeAddressTransactionInfo) {
        handleParsedHomeAddress(results[0]);
        transitionClientInfo.updateHomeAddress = true;
      }
    }).catch(error => console.error('Error', error));
  };

  const notesSection = () => {
    return (
      <div
        onMouseEnter={setHoverTrue}
        onMouseLeave={() => setHover(false)}
        className="transition-input transition-note">
        <textarea
            placeholder="Add a note about this section"
            value={transactionInfo[transactionName]}
            onChange={e => handleInputChange(e)}
        />
        {hover && (<div onClick={() => saveEdit(true)} className="transition-edit">Save</div>)}
      </div>
    );
  };

  const linkSection = () => {
    return (
      <div
        onMouseEnter={setHoverTrue}
        onMouseLeave={() => setHover(false)}
        className="transition-input transition-note">
        <a href={transactionInfo[transactionName]}>{transactionInfo[transactionName]}</a>
      </div>
    );
  };

  const booleanSection = () => {
    const clientInfoTransactionValue = getTransactionClientInfoStore();
    const infoTransactionValue = getTransactionClientInfoStore();
    return (
      <select
          onChange={e => convertToBoolean(e)}
          value={ value || (clientInfoTransactionValue && infoTransactionValue === true ? 'Yes' : clientInfoTransactionValue === false ? 'No' : 'Select an option') }>
          <option>Select an option</option>
          <option>Yes</option>
          <option>No</option>
      </select>
    );
  };

  const placesInputSection = () => {
    return (
      <PlacesAutocomplete
        value={getTransactionValue()}
        onChange={handleAddressChanged}
        onSelect={handleAddressSelected}>
        {({ getInputProps, suggestions, getSuggestionItemProps }) => (
          <div className="hyke-autocomplete">
              <Input {...getInputProps({ placeholder: '', className: 'location-search-input' })} />
              <ul className="hyke-autocomplete__list">
                {suggestions.map((suggestion, key) => {
                    const className = suggestion.active ? 'is-active' : null;
                    return (
                      <li key={key} {...getSuggestionItemProps(suggestion, { className })}>
                        <span>{suggestion.description}</span>
                      </li>
                    );
                })}
              </ul>
          </div>
        )}
      </PlacesAutocomplete>
    );
  };

  const inputSection = () => {
    return (
      <input
        type={dollar ? 'number' : 'text'}
        placeholder={placeholder}
        value={getTransactionValue()()}
        onChange={e => handleInputChange(e)}
      />
    );
  };

  const defaultSection = () => {
    const clientInfoTransactionValue = getTransactionClientInfoStore();
    const infoTransactionValue = getTransactionClientInfoStore();
    const transactionValue = getTransactionValue()
    return (
      <div className="transition-input" onMouseEnter={setHoverTrue} onMouseLeave={() => setHover(false)}>
          { edit && (
            <ClickOutHandler onClickOut={cancelEdit}>
              { boolean ?
                (booleanSection) :
                placesInput ?
                  (placesInputSection()) :
                  (inputSection())
              }
              {edit && (<div onClick={saveEdit} className="transition-edit">Save</div>)}
            </ClickOutHandler>
          )}

          {!edit && (
            <>
              <span onClick={enterEditMode}>
                  {boolean?
                    value ||
                        ( clientInfoTransactionValue && infoTransactionValue === true ?
                            'Yes' :
                            clientInfoTransactionValue === false?
                              'No' :
                              'Select an option')
                      : index
                      ? transactionValue:
                        `${dollar ? '$' : ''}${transactionValue}`
                  }
              </span>
              {hover && (<div onClick={enterEditMode} className="transition-edit">Edit</div>)}
            </>
          )}
      </div>);
  };

  // 6. split react section into separate functions that can be reused
  return (<>
    {notes ?
      (notesSection()) :
      (link ?
        (linkSection()) :
        (defaultSection())
      )
    }
  </>);
});

export default TransitionInput;