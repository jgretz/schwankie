import React from 'react';
import {Form, Button} from 'semantic-ui-react';
import {connect} from 'react-redux';

import {updateLinkForm, findLink, removeLink, saveLink} from '../../actions';
import {linkSelector} from '../../selectors';

const handleChange = (field, updateLinkForm) => event => {
  updateLinkForm(field, event.target.value);
};

const handleLinkBlur = (url, findLink) => () => {
  findLink(url);
};

const handleDelete = (link, removeLink) => () => {
  removeLink(link);
};

const handleSave = (link, saveLink) => () => {
  saveLink(link);
};

const linkForm = ({link, updateLinkForm, findLink, removeLink, saveLink}) => (
  <div className="linkForm">
    <div className="forms">
      <Form className="urlForm">
        <Form.Input label="Url:" control="input" placeholder="url" value={link.url} onChange={handleChange('url', updateLinkForm)} onBlur={handleLinkBlur(link.url, findLink)} />
      </Form>
      <Form className="detailForm">
        <Form.Input label="Title:" control="input" placeholder="title" value={link.title} onChange={handleChange('title', updateLinkForm)} />
        <Form.Input label="Description:" control="input" placeholder="description" value={link.description} onChange={handleChange('description', updateLinkForm)} />
        <Form.Input label="Tags:" control="input" placeholder="tags" value={link.tags} onChange={handleChange('tags', updateLinkForm)} />
      </Form>
    </div>
    <div className="buttons">
    <Button.Group>
      <Button negative onClick={handleDelete(link, removeLink)}>Delete</Button>
      <Button.Or />
      <Button positive onClick={handleSave(link, saveLink)}>Save</Button>
    </Button.Group>
    </div>
  </div>
);

const mapStateToProps = state => ({
  link: linkSelector(state),
});

export default connect(mapStateToProps, {updateLinkForm, findLink, removeLink, saveLink})(linkForm);