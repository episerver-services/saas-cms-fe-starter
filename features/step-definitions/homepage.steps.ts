import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'chai'
import fetch from 'node-fetch'

let responseText: string

Given('the CMS is returning homepage content', function () {
  // No-op for now — in dev, mock content is returned automatically.
})

When('the user visits the homepage', async function () {
  const res = await fetch('http://localhost:3000')
  if (!res.ok) {
    throw new Error(`Failed to load homepage: ${res.status}`)
  }
  responseText = await res.text()
})

Then(
  'the page should include the title {string}',
  function (expectedTitle: string) {
    expect(responseText).to.include(expectedTitle)
  }
)

Then('the page should include the call to action', function () {
  expect(responseText).to.include('Get in touch')
})
