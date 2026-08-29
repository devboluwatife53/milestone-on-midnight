import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_2 = __compactRuntime.CompactTypeOpaqueString;

class _MilestonePost_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment()));
  }
  fromValue(value_0) {
    return {
      author: _descriptor_0.fromValue(value_0),
      tier: _descriptor_1.fromValue(value_0),
      label: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.author).concat(_descriptor_1.toValue(value_0.tier).concat(_descriptor_2.toValue(value_0.label)));
  }
}

const _descriptor_3 = new _MilestonePost_0();

const _descriptor_4 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_5 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

const _descriptor_6 = __compactRuntime.CompactTypeBoolean;

class _Either_0 {
  alignment() {
    return _descriptor_6.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_6.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_6.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_7 = new _Either_0();

const _descriptor_8 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_9 = new _ContractAddress_0();

class _Maybe_0 {
  alignment() {
    return _descriptor_6.alignment().concat(_descriptor_3.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_6.fromValue(value_0),
      value: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_6.toValue(value_0.is_some).concat(_descriptor_3.toValue(value_0.value));
  }
}

const _descriptor_10 = new _Maybe_0();

const _descriptor_11 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.localSecretKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named localSecretKey');
    }
    if (typeof(witnesses_0.addToHiddenProgress) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named addToHiddenProgress');
    }
    if (typeof(witnesses_0.currentTier) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named currentTier');
    }
    if (typeof(witnesses_0.advanceTier) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named advanceTier');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      celebrate: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`celebrate: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const amount_0 = args_1[1];
        const label_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('celebrate',
                                     'argument 1 (as invoked from Typescript)',
                                     'milestone.compact line 39 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('celebrate',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'milestone.compact line 39 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(amount_0).concat(_descriptor_2.toValue(label_0)),
            alignment: _descriptor_1.alignment().concat(_descriptor_2.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._celebrate_0(context,
                                           partialProofData,
                                           amount_0,
                                           label_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      publicKey(context, ...args_1) {
        return { result: pureCircuits.publicKey(...args_1), context };
      }
    };
    this.impureCircuits = { celebrate: this.circuits.celebrate };
    this.provableCircuits = { celebrate: this.circuits.celebrate };
  }
  initialState(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('celebrate', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(0n),
                                                                                              alignment: _descriptor_11.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                                                                                                                                             alignment: _descriptor_1.alignment() }))
                                                          .encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(1n),
                                                                                              alignment: _descriptor_11.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_5, value_0);
    return result_0;
  }
  _localSecretKey_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.localSecretKey(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('localSecretKey',
                                 'return value',
                                 'milestone.compact line 23 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _addToHiddenProgress_0(context, partialProofData, amount_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.addToHiddenProgress(witnessContext_0,
                                                                              amount_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('addToHiddenProgress',
                                 'return value',
                                 'milestone.compact line 24 char 1',
                                 'Uint<0..18446744073709551616>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_1.toValue(result_0),
      alignment: _descriptor_1.alignment()
    });
    return result_0;
  }
  _currentTier_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.currentTier(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('currentTier',
                                 'return value',
                                 'milestone.compact line 25 char 1',
                                 'Uint<0..18446744073709551616>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_1.toValue(result_0),
      alignment: _descriptor_1.alignment()
    });
    return result_0;
  }
  _advanceTier_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.advanceTier(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 0 )) {
      __compactRuntime.typeError('advanceTier',
                                 'return value',
                                 'milestone.compact line 26 char 1',
                                 '[]',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  _celebrate_0(context, partialProofData, amount_0, label_0) {
    __compactRuntime.assert(amount_0 > 0n, 'Progress must be positive');
    const milestoneStep_0 = 100n;
    const newTotal_0 = this._addToHiddenProgress_0(context,
                                                   partialProofData,
                                                   amount_0);
    const tier_0 = this._currentTier_0(context, partialProofData);
    const nextThreshold_0 = (tier_0 + 1n) * milestoneStep_0;
    const crossed_0 = newTotal_0 >= nextThreshold_0;
    if (crossed_0) {
      this._advanceTier_0(context, partialProofData);
      const author_0 = this._publicKey_0(this._localSecretKey_0(context,
                                                                partialProofData));
      const tmp_0 = { author: author_0,
                      tier:
                        ((t1) => {
                          if (t1 > 18446744073709551615n) {
                            throw new __compactRuntime.CompactError('milestone.compact line 51 char 22: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                          }
                          return t1;
                        })(tier_0 + 1n),
                      label: label_0 };
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_11.toValue(0n),
                                                                    alignment: _descriptor_11.alignment() } }] } },
                                         { dup: { n: 0 } },
                                         { idx: { cached: false,
                                                  pushPath: false,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_11.toValue(2n),
                                                                    alignment: _descriptor_11.alignment() } }] } },
                                         { addi: { immediate: 1 } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newArray()
                                                            .arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                                                             alignment: _descriptor_3.alignment() })).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull())
                                                            .encode() } },
                                         { swap: { n: 0 } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(2n),
                                                                                                alignment: _descriptor_11.alignment() }).encode() } },
                                         { swap: { n: 0 } },
                                         { ins: { cached: true, n: 1 } },
                                         { swap: { n: 0 } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(1n),
                                                                                                alignment: _descriptor_11.alignment() }).encode() } },
                                         { swap: { n: 0 } },
                                         { ins: { cached: true, n: 2 } }]);
      const tmp_1 = 1n;
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_11.toValue(1n),
                                                                    alignment: _descriptor_11.alignment() } }] } },
                                         { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                                { value: _descriptor_4.toValue(tmp_1),
                                                                  alignment: _descriptor_4.alignment() }
                                                                  .value
                                                              )) } },
                                         { ins: { cached: true, n: 1 } }]);
    }
    return [];
  }
  _publicKey_0(sk_0) {
    return this._persistentHash_0([new Uint8Array([109, 105, 108, 101, 115, 116, 111, 110, 101, 58, 112, 107, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   sk_0]);
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    feed: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_11.toValue(0n),
                                                                                                     alignment: _descriptor_11.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_11.toValue(1n),
                                                                                                     alignment: _descriptor_11.alignment() } }] } },
                                                                          'type',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(1n),
                                                                                                                                 alignment: _descriptor_11.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      length(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`length: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_11.toValue(0n),
                                                                                                     alignment: _descriptor_11.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_11.toValue(2n),
                                                                                                     alignment: _descriptor_11.alignment() } }] } },
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      head(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`head: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_11.toValue(0n),
                                                                                                      alignment: _descriptor_11.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_11.toValue(0n),
                                                                                                      alignment: _descriptor_11.alignment() } }] } },
                                                                           { dup: { n: 0 } },
                                                                           'type',
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(1n),
                                                                                                                                  alignment: _descriptor_11.alignment() }).encode() } },
                                                                           'eq',
                                                                           { branch: { skip: 4 } },
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(1n),
                                                                                                                                  alignment: _descriptor_11.alignment() }).encode() } },
                                                                           { swap: { n: 0 } },
                                                                           { concat: { cached: false,
                                                                                       n: (2+Number(__compactRuntime.maxAlignedSize(
                                                                                               _descriptor_3
                                                                                               .alignment()
                                                                                             ))) } },
                                                                           { jmp: { skip: 2 } },
                                                                           'pop',
                                                                           { push: { storage: false,
                                                                                     value: __compactRuntime.StateValue.newCell(__compactRuntime.alignedConcat(
                                                                                                                                  { value: _descriptor_11.toValue(0n),
                                                                                                                                    alignment: _descriptor_11.alignment() },
                                                                                                                                  { value: _descriptor_3.toValue({ author: new Uint8Array(32), tier: 0n, label: '' }),
                                                                                                                                    alignment: _descriptor_3.alignment() }
                                                                                                                                )).encode() } },
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return (() => {  var iter = { curr: self_0 };  iter.next = () => {    const arr = iter.curr.asArray();    const head = arr[0];    if(head.type() == "null") {      return { done: true };    } else {      iter.curr = arr[1];      return { value: _descriptor_3.fromValue(head.asCell().value), done: false };    }  };  return iter;})();
      }
    },
    get totalCelebrated() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_11.toValue(1n),
                                                                                                   alignment: _descriptor_11.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  localSecretKey: (...args) => undefined,
  addToHiddenProgress: (...args) => undefined,
  currentTier: (...args) => undefined,
  advanceTier: (...args) => undefined
});
export const pureCircuits = {
  publicKey: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`publicKey: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const sk_0 = args_0[0];
    if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32)) {
      __compactRuntime.typeError('publicKey',
                                 'argument 1',
                                 'milestone.compact line 58 char 1',
                                 'Bytes<32>',
                                 sk_0)
    }
    return _dummyContract._publicKey_0(sk_0);
  }
};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
