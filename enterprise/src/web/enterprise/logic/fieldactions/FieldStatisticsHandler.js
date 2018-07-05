import Immutable from 'immutable';

import { WidgetActions } from 'enterprise/stores/WidgetStore';
import AggregationWidgetConfig from 'enterprise/logic/aggregationbuilder/AggregationWidgetConfig';
import AggregationWidget from 'enterprise/logic/aggregationbuilder/AggregationWidget';
import { FieldTypesStore } from 'enterprise/stores/FieldTypesStore';
import { ViewMetadataStore } from 'enterprise/stores/ViewMetadataStore';

class FieldTypeSpecificSeries {
  static NUMERIC_FIELD_SERIES = ['count', 'sum', 'avg', 'min', 'max', 'stddev', 'variance', 'card'];
  static NONNUMERIC_FIELD_SERIES = ['count', 'card'];

  constructor() {
    this.state = FieldTypesStore.getInitialState();
    FieldTypesStore.listen((newState) => {
      this.state = newState;
    });

    this.onViewMetadataStoreUpdate(ViewMetadataStore.getInitialState());
    ViewMetadataStore.listen(this.onViewMetadataStoreUpdate);
  }

  onViewMetadataStoreUpdate = (newState) => {
    const { activeQuery } = newState;
    this.activeQuery = activeQuery;
  };

  seriesFor(field) {
    const { all, queryFields } = this.state;
    const currentQueryFields = queryFields.get(this.activeQuery, Immutable.Set());
    const fieldDefinition = currentQueryFields.concat(all).find(({ name }) => name === field);

    if (fieldDefinition && fieldDefinition.type.isNumeric()) {
      return FieldTypeSpecificSeries.NUMERIC_FIELD_SERIES;
    }
    return FieldTypeSpecificSeries.NONNUMERIC_FIELD_SERIES;
  }
}

export default function (queryId, field) {
  const fieldTypeSpecificSeries = new FieldTypeSpecificSeries();
  const series = fieldTypeSpecificSeries.seriesFor(field).map(f => `${f}(${field})`);
  const config = AggregationWidgetConfig.builder()
    .rowPivots([])
    .columnPivots([])
    .series(series)
    .sort([])
    .visualization('table')
    .build();
  const widget = AggregationWidget.builder()
    .newId()
    .config(config)
    .build();
  WidgetActions.create(widget);
}
